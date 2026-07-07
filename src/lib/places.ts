// ─── Google Places enrichment provider ───────────────────────────────────────
// Places API (New) searchText/searchNearby behind a PlacesProvider interface.
// Google Places is the liveness/type/geometry/hours source of truth; DOHMH
// stays the health-grade source of truth. With no GOOGLE_PLACES_API_KEY the
// whole layer no-ops (log once) and current behavior is unchanged.
//
// Cost model = caching: results cache 7 days per venue key (CAMIS) and per
// bodega cell, in Supabase (shared across lambdas) + an in-memory LRU per
// lambda. Only venues that reach the ranked candidate set are enriched, and a
// nightly cron pre-warms the LIC + Manhattan-core cells. A hard daily budget
// (PLACES_DAILY_BUDGET) flips the layer to cache-only.

import type { WeeklyHours, Interval } from "@/lib/hours";
import { PLACES_CONFIG } from "@/lib/placesConfig";
import { serviceClient } from "@/lib/supabase/service";

export type BusinessStatus = "OPERATIONAL" | "CLOSED_TEMPORARILY" | "CLOSED_PERMANENTLY";

/** The subset of a Google Place we keep (matches the searchText field mask). */
export interface PlaceLite {
  placeId: string;
  displayName: string;
  businessStatus: BusinessStatus | null;
  types: string[];
  lat: number;
  lng: number;
  formattedAddress: string;
  weeklyHours: WeeklyHours | null;
  rating: number | null;
  userRatingCount: number | null;
}

/** Outcome of matching one DOHMH venue against Places.
 *  - matched: confident name match within MATCH_MAX_DISTANCE_M → safe to gate
 *    liveness, override geometry/hours/category.
 *  - address-mismatch: confident name match but BEYOND the distance gate —
 *    the commissary/production-kitchen pattern. Never a walkable pick.
 *  - unmatched: nothing similar nearby (no gating on its own; combined with
 *    inspection age it may become 'unverified-stale'). */
export interface PlacesEnrichment {
  status: "matched" | "address-mismatch" | "unmatched";
  matchConfidence: number | null;
  distanceM: number | null;
  place: PlaceLite | null;
  fetchedAt: string;
}

export interface PlacesProvider {
  readonly enabled: boolean;
  /** Enrich one venue. Returns null when the layer could not attempt a lookup
   *  (no key, budget exhausted with no cache, network error) — callers must
   *  treat null as "no information", never as "unmatched". */
  enrichVenue(v: { key: string; name: string; address: string; lat: number; lng: number }): Promise<PlacesEnrichment | null>;
  /** Bodega/deli candidates for a geo cell (cached per cell). Null = not attempted. */
  searchBodegas(cell: { lat: number; lng: number; radiusM: number }): Promise<PlaceLite[] | null>;
}

const FIELD_MASK = [
  "places.id",
  "places.businessStatus",
  "places.types",
  "places.location",
  "places.formattedAddress",
  "places.regularOpeningHours",
  "places.displayName",
  "places.rating",
  "places.userRatingCount",
].join(",");

// ── Places API (New) hours → WeeklyHours ─────────────────────────────────────
// New-API periods: { open: {day, hour, minute}, close?: {day, hour, minute} }.
// 24/7 venues return a single open period with no close.
interface NewPeriodPoint { day: number; hour: number; minute: number }
export function newPlacesPeriodsToWeekly(
  periods: { open?: NewPeriodPoint; close?: NewPeriodPoint }[] | undefined,
): WeeklyHours | null {
  if (!periods || periods.length === 0) return null;
  const weekly: WeeklyHours = Array.from({ length: 7 }, () => [] as Interval[]);
  let any = false;
  for (const p of periods) {
    if (!p.open || p.open.day == null) continue;
    const openMin = p.open.hour * 60 + (p.open.minute ?? 0);
    if (!p.close) {
      // Open 24/7 (Court Square Diner class): one close-less period.
      return Array.from({ length: 7 }, () => [{ open: 0, close: 1440 }]);
    }
    let closeMin = p.close.hour * 60 + (p.close.minute ?? 0);
    if (p.close.day !== p.open.day || closeMin <= openMin) closeMin += 1440;
    weekly[p.open.day].push({ open: openMin, close: closeMin });
    any = true;
  }
  return any ? weekly : null;
}

// ── Name similarity (token overlap + Jaro-Winkler on normalized names) ──────
const NAME_NOISE_TOKENS = new Set(["the", "a", "of", "and", "nyc", "ny", "new", "york", "inc", "llc", "corp", "restaurant", "cafe"]);

export function normalizeForMatch(name: string): string {
  return name
    .toLowerCase()
    .replace(/#\s*\d+/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(name: string): string[] {
  return normalizeForMatch(name).split(" ").filter((t) => t && !NAME_NOISE_TOKENS.has(t));
}

/** Fraction of the SHORTER name's meaningful tokens present in the other.
 *  "Maman" vs "Petite Maman" → 1.0 (the commissary pattern needs the name
 *  match to be recognized so the distance gate can reject it explicitly). */
export function tokenOverlap(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.length === 0 || tb.length === 0) return 0;
  const [small, big] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  const bigSet = new Set(big);
  const hits = small.filter((t) => bigSet.has(t)).length;
  return hits / small.length;
}

export function jaroWinkler(s1: string, s2: string): number {
  const a = normalizeForMatch(s1);
  const b = normalizeForMatch(s2);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const window = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const aMatch = new Array<boolean>(a.length).fill(false);
  const bMatch = new Array<boolean>(b.length).fill(false);
  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const lo = Math.max(0, i - window);
    const hi = Math.min(b.length - 1, i + window);
    for (let j = lo; j <= hi; j++) {
      if (!bMatch[j] && a[i] === b[j]) {
        aMatch[i] = bMatch[j] = true;
        matches++;
        break;
      }
    }
  }
  if (matches === 0) return 0;
  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatch[i]) continue;
    while (!bMatch[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }
  const m = matches;
  const jaro = (m / a.length + m / b.length + (m - transpositions / 2) / m) / 3;
  let prefix = 0;
  for (let i = 0; i < Math.min(4, a.length, b.length) && a[i] === b[i]; i++) prefix++;
  return jaro + prefix * 0.1 * (1 - jaro);
}

export function nameSimilarity(a: string, b: string): number {
  return Math.max(tokenOverlap(a, b), jaroWinkler(a, b));
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/** Pure match classifier — the Yards/Maman fixtures test THIS.
 *  Given the DOHMH venue and the Places candidates, pick the best name match
 *  and apply the two gates: similarity ≥ threshold AND distance ≤ 150m. */
export function classifyMatch(
  venue: { name: string; lat: number; lng: number },
  candidates: PlaceLite[],
  now: () => string = () => new Date().toISOString(),
): PlacesEnrichment {
  let best: { place: PlaceLite; sim: number; dist: number } | null = null;
  for (const place of candidates) {
    const sim = nameSimilarity(venue.name, place.displayName);
    if (sim < PLACES_CONFIG.NAME_SIMILARITY_THRESHOLD) continue;
    const dist = haversineM(venue.lat, venue.lng, place.lat, place.lng);
    if (!best || sim > best.sim || (sim === best.sim && dist < best.dist)) {
      best = { place, sim, dist };
    }
  }
  if (!best) return { status: "unmatched", matchConfidence: null, distanceM: null, place: null, fetchedAt: now() };
  if (best.dist > PLACES_CONFIG.MATCH_MAX_DISTANCE_M) {
    // Confident name match beyond the distance gate = the commissary pattern
    // (Maman's Austell Pl production kitchen vs the 47th Ave café). A
    // production kitchen must never be a walkable recommendation.
    return { status: "address-mismatch", matchConfidence: round2(best.sim), distanceM: Math.round(best.dist), place: best.place, fetchedAt: now() };
  }
  return { status: "matched", matchConfidence: round2(best.sim), distanceM: Math.round(best.dist), place: best.place, fetchedAt: now() };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Cache: in-memory LRU per lambda + Supabase places_cache (7-day TTL) ─────
const memoryCache = new Map<string, { value: unknown; at: number }>();

function ttlMs(): number {
  return PLACES_CONFIG.CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
}

function memGet<T>(key: string): T | undefined {
  const hit = memoryCache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > ttlMs()) {
    memoryCache.delete(key);
    return undefined;
  }
  // LRU touch
  memoryCache.delete(key);
  memoryCache.set(key, hit);
  return hit.value as T;
}

function memSet(key: string, value: unknown) {
  memoryCache.set(key, { value, at: Date.now() });
  while (memoryCache.size > PLACES_CONFIG.MEMORY_LRU_MAX) {
    const oldest = memoryCache.keys().next().value;
    if (oldest === undefined) break;
    memoryCache.delete(oldest);
  }
}

async function cacheGet<T>(key: string): Promise<T | undefined> {
  const mem = memGet<T>(key);
  if (mem !== undefined) return mem;
  const sb = serviceClient();
  if (!sb) return undefined;
  try {
    const { data } = await sb.from("places_cache").select("payload, fetched_at").eq("key", key).maybeSingle();
    if (!data) return undefined;
    if (Date.now() - new Date(data.fetched_at as string).getTime() > ttlMs()) return undefined;
    memSet(key, data.payload);
    return data.payload as T;
  } catch {
    return undefined;
  }
}

function cacheSet(key: string, value: unknown) {
  memSet(key, value);
  const sb = serviceClient();
  if (!sb) return;
  // Fire-and-forget: a cache write must never block or fail a user request.
  sb.from("places_cache")
    .upsert({ key, payload: value, fetched_at: new Date().toISOString() })
    .then(({ error }) => {
      if (error && process.env.NODE_ENV !== "production") console.log("[places] cache write skipped:", error.message);
    });
}

// ── Daily call budget (places_api_calls counter) ─────────────────────────────
function dailyBudget(): number {
  const env = parseInt(process.env.PLACES_DAILY_BUDGET || "", 10);
  return Number.isFinite(env) && env > 0 ? env : PLACES_CONFIG.DAILY_BUDGET_DEFAULT;
}

function nycDay(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}

let memDay = "";
let memCalls = 0;
let sharedCountSyncedAt = 0;
let budgetLogged = false;

async function budgetAllows(): Promise<boolean> {
  const day = nycDay();
  if (day !== memDay) {
    memDay = day;
    memCalls = 0;
    sharedCountSyncedAt = 0;
    budgetLogged = false;
  }
  // Sync the shared counter at most once a minute per lambda — the budget is
  // a cost circuit-breaker, not an exact meter.
  const sb = serviceClient();
  if (sb && Date.now() - sharedCountSyncedAt > 60_000) {
    sharedCountSyncedAt = Date.now();
    try {
      const { data } = await sb.from("places_counters").select("calls").eq("day", day).maybeSingle();
      if (data && typeof data.calls === "number" && data.calls > memCalls) memCalls = data.calls;
    } catch {}
  }
  if (memCalls >= dailyBudget()) {
    if (!budgetLogged) {
      budgetLogged = true;
      console.warn(`[places] daily budget ${dailyBudget()} reached (${memDay}) — serving cache-only until tomorrow`);
    }
    return false;
  }
  return true;
}

function recordCall() {
  memCalls++;
  const sb = serviceClient();
  if (!sb) return;
  sb.rpc("increment_places_calls", { p_day: nycDay() }).then(({ error }) => {
    if (error && process.env.NODE_ENV !== "production") console.log("[places] counter rpc skipped:", error.message);
  });
}

/** Today's call count as this lambda knows it — for the warm cron's report. */
export function placesCallsToday(): number {
  return nycDay() === memDay ? memCalls : 0;
}

// ── Google implementation ────────────────────────────────────────────────────
interface RawPlace {
  id?: string;
  displayName?: { text?: string };
  businessStatus?: string;
  types?: string[];
  location?: { latitude?: number; longitude?: number };
  formattedAddress?: string;
  regularOpeningHours?: { periods?: { open?: NewPeriodPoint; close?: NewPeriodPoint }[] };
  rating?: number;
  userRatingCount?: number;
}

function toPlaceLite(raw: RawPlace): PlaceLite | null {
  if (!raw.id || raw.location?.latitude == null || raw.location?.longitude == null) return null;
  const status = raw.businessStatus;
  return {
    placeId: raw.id,
    displayName: raw.displayName?.text ?? "",
    businessStatus: status === "OPERATIONAL" || status === "CLOSED_TEMPORARILY" || status === "CLOSED_PERMANENTLY" ? status : null,
    types: raw.types ?? [],
    lat: raw.location.latitude,
    lng: raw.location.longitude,
    formattedAddress: raw.formattedAddress ?? "",
    weeklyHours: newPlacesPeriodsToWeekly(raw.regularOpeningHours?.periods),
    rating: raw.rating ?? null,
    userRatingCount: raw.userRatingCount ?? null,
  };
}

class GooglePlacesProvider implements PlacesProvider {
  readonly enabled = true;
  constructor(private readonly key: string) {}

  private async post(path: "searchText" | "searchNearby", body: Record<string, unknown>): Promise<PlaceLite[] | null> {
    if (!(await budgetAllows())) return null;
    try {
      const res = await fetch(`https://places.googleapis.com/v1/places:${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.key,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(4000),
      });
      recordCall();
      if (!res.ok) {
        console.warn(`[places] ${path} HTTP ${res.status}`);
        return null;
      }
      const data = (await res.json()) as { places?: RawPlace[] };
      return (data.places ?? []).map(toPlaceLite).filter((p): p is PlaceLite => p !== null);
    } catch (e) {
      console.warn(`[places] ${path} failed:`, e instanceof Error ? e.message : e);
      return null;
    }
  }

  async enrichVenue(v: { key: string; name: string; address: string; lat: number; lng: number }): Promise<PlacesEnrichment | null> {
    const cacheKey = `venue:${v.key}`;
    const cached = await cacheGet<PlacesEnrichment>(cacheKey);
    if (cached) return cached;

    const candidates = await this.post("searchText", {
      textQuery: `${v.name} ${v.address}`.trim(),
      locationBias: {
        circle: { center: { latitude: v.lat, longitude: v.lng }, radius: PLACES_CONFIG.SEARCH_BIAS_RADIUS_M },
      },
      pageSize: 5,
    });
    if (candidates === null) return null; // budget/network — no information, don't cache

    const enrichment = classifyMatch({ name: v.name, lat: v.lat, lng: v.lng }, candidates);
    cacheSet(cacheKey, enrichment);
    return enrichment;
  }

  async searchBodegas(cell: { lat: number; lng: number; radiusM: number }): Promise<PlaceLite[] | null> {
    const cacheKey = `bodega-cell:${cell.lat.toFixed(3)}:${cell.lng.toFixed(3)}`;
    const cached = await cacheGet<PlaceLite[]>(cacheKey);
    if (cached) return cached;

    const places = await this.post("searchNearby", {
      includedTypes: ["convenience_store", "deli"],
      maxResultCount: 20,
      rankPreference: "DISTANCE",
      locationRestriction: {
        circle: { center: { latitude: cell.lat, longitude: cell.lng }, radius: cell.radiusM },
      },
    });
    if (places === null) return null;
    cacheSet(cacheKey, places);
    return places;
  }
}

const NOOP_PROVIDER: PlacesProvider = {
  enabled: false,
  enrichVenue: async () => null,
  searchBodegas: async () => null,
};

let noKeyLogged = false;

/** The active provider. Without GOOGLE_PLACES_API_KEY the layer no-ops and
 *  current behavior is unchanged (logged once per lambda). */
export function getPlacesProvider(): PlacesProvider {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    if (!noKeyLogged) {
      noKeyLogged = true;
      console.log("[places] GOOGLE_PLACES_API_KEY not set — enrichment layer disabled, DOHMH-only behavior");
    }
    return NOOP_PROVIDER;
  }
  return new GooglePlacesProvider(key);
}
