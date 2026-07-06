"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { WedgeHero } from "./WedgeHero";
import { WedgeSearch } from "./WedgeSearch";
import { QuickFilterChips, type ChipId } from "./QuickFilterChips";
import { MealTypeToggle } from "./MealTypeToggle";
import { LiveResultsStrip, type ResultSpot, type SortKey } from "./LiveResultsStrip";
import { SpotModal } from "./SpotModal";
import { AppWaitlistCapture } from "../AppWaitlistCapture";
import { detectMealType, type MealCategory } from "@/lib/inferMealType";
import { trackEvent } from "@/lib/analytics";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { reverseGeocode } from "@/lib/geocode";
import { findNearestNeighborhood } from "@/lib/nearestNeighborhood";
import {
  readLocation,
  writeLocation,
  subscribeLocation,
  requestBrowserLocation,
  type LocationStatus,
} from "@/lib/locationStore";

const LocalMap = dynamic(() => import("./LocalMap").then(m => m.LocalMap), { ssr: false });

const TIMES_SQUARE = { lat: 40.758, lng: -73.9855 };
const MEAL_LS_KEY = "pulsenyc:mealType";

interface ApiRestaurant {
  slug: string;
  restaurantName: string;
  priceRange: number;
  priceTier?: string;
  walkMinutes: number;
  lat: number;
  lng: number;
  address: string;
  grade: string;
  inspectedAt?: string | null;
  isGeneric: boolean;
  category: string;
  topPicks: { name: string; calories: number; protein: number; pulseScore: number; estPrice?: number | null }[];
  bestDrink?: { name: string; calories: number; protein: number } | null;
  locationCount?: number;
  otherLocations?: { address: string; walkMinutes: number; grade: string }[];
  orderingTip?: string;
  verifiedBadge?: "verified" | "needs-recheck" | null;
  verifiedAt?: string | null;
  verifiedSlug?: string | null;
  openState?: "open" | "closed" | "unknown";
  hoursChip?: { label: string; tone: "open" | "closed" | "unknown" } | null;
  camis?: string | null;
}

function readCachedMeal(): MealCategory | null {
  try {
    const v = localStorage.getItem(MEAL_LS_KEY);
    if (v && ["breakfast", "lunch", "coffee", "snack", "dinner"].includes(v)) return v as MealCategory;
  } catch {}
  return null;
}

// Nearest-neighborhood lookup lives in src/lib/nearestNeighborhood.ts
// (multi-anchor + cos-scaled — fixes Hunters Point resolving to Greenpoint)

// Wedge-weighted default ranking: PulseScore with the under-$15 anchor baked
// in, so the default order IS "macro-friendly under $15". Documented on
// /methodology.
function wedgeScore(r: ResultSpot): number {
  const base = r.topPickScore ?? 0;
  const under15 = r.topPickPrice != null ? r.topPickPrice <= 15 : r.priceRange <= 2;
  // +2 verified bump: at equal PulseScore, "we walked in and checked" beats
  // a chain's corporate nutrition PDF
  return base + (under15 ? 8 : 0) - (r.priceRange >= 3 ? 8 : 0) + (r.verifiedBadge === "verified" ? 2 : 0);
}

function syncNeighborhood(lat: number, lng: number, source: "gps" | "manual") {
  const hood = findNearestNeighborhood(lat, lng);
  if (!hood) return;
  const detail = { slug: hood.slug, name: hood.name, borough: hood.borough };
  try {
    localStorage.setItem("pulse-my-neighborhood", JSON.stringify(detail));
  } catch {}
  window.dispatchEvent(new CustomEvent("pulse-my-neighborhood-change", { detail }));
}

export function WedgeSection() {
  const router = useRouter();

  // coords stays null until the persisted location has been read (hydration
  // gate). The first fetch must NEVER fire with the Times Square fallback when
  // a saved location exists — that race rendered Midtown venues under a LIC
  // banner (July 5 audit, P0).
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState("Set location");
  const [isDefault, setIsDefault] = useState(true);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  // accuracy > 2km (desktop IP geolocation): show the resolved neighborhood
  // and ask for confirmation instead of silently using it
  const [lowConfidenceHood, setLowConfidenceHood] = useState<string | null>(null);

  // "Under $15" defaults ON for Lunch — the default view IS the wedge
  const [activeChips, setActiveChips] = useState<Set<ChipId>>(() => {
    const base: ChipId[] = ["high-protein"];
    if (detectMealType() === "lunch") base.push("under-15");
    return new Set(base);
  });
  const [mealType, setMealType] = useState<MealCategory>(() => detectMealType());

  const [allSpots, setAllSpots] = useState<ResultSpot[]>([]);
  // The origin that PRODUCED the current result set. Travels with the response
  // envelope (set in the same state batch as allSpots) so the map center and
  // any origin-derived UI can never mix a new location with stale venues.
  const [resultsOrigin, setResultsOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mapVisible, setMapVisible] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("score");

  // ?spot= is read from window.location instead of useSearchParams: the hook
  // opts this whole section out of the static prerender, which stripped the
  // hero/H1/waitlist from crawler HTML. Deep links resolve on mount; the
  // modal is client-only anyway.
  const [spotSlug, setSpotSlug] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setSpotSlug(new URLSearchParams(window.location.search).get("spot"));
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);

  // Filter spots by active chips, then sort by the selected key.
  // The hero promises "under $15" unconditionally, so the ranked five may ONLY
  // contain ≤$15 picks (exact price or band ceiling). Over-$15 venues are never
  // hidden — they rank below a visually distinct "Worth a splurge" divider.
  const { spots, splurgeSpots } = useMemo(() => {
    // Known-closed venues are excluded from the ranked top-5 — "right now" must
    // be true. Open + unknown-hours venues remain rankable. (Closed venues still
    // reach the map below, dimmed.)
    let filtered = allSpots.filter(r => r.openState !== "closed");
    if (activeChips.has("quick")) {
      filtered = filtered.filter(r => r.walkMinutes <= 5);
    }
    // Known order price wins; unknown falls back to the venue's price band
    const isUnder15 = (r: ResultSpot) =>
      r.topPickPrice != null ? r.topPickPrice <= 15 : r.priceRange <= 2;
    if (activeChips.has("under-15")) {
      // Strict mode: the chip removes over-$15 venues entirely (no splurge row)
      filtered = filtered.filter(isUnder15);
    }
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "protein": return (b.topPickProtein ?? 0) - (a.topPickProtein ?? 0);
        case "calories": return (a.topPickCalories || 9999) - (b.topPickCalories || 9999);
        case "distance": return a.walkMinutes - b.walkMinutes;
        case "protein-per-dollar":
          return (b.topPickProtein ?? 0) / Math.max(1, b.priceRange) - (a.topPickProtein ?? 0) / Math.max(1, a.priceRange);
        case "score":
        default:
          return wedgeScore(b) - wedgeScore(a);
      }
    });
    const under15 = sorted.filter(isUnder15);
    const over15 = sorted.filter(r => !isUnder15(r));
    return { spots: under15.slice(0, 5), splurgeSpots: over15.slice(0, 3) };
  }, [allSpots, activeChips, sortBy]);

  // Map shows the ranked picks PLUS any known-closed venues nearby, dimmed —
  // the prompt's "still on the map, dimmed, 'Closed · opens 7am'".
  const mapSpots = useMemo(() => {
    const closed = allSpots.filter(r => r.openState === "closed").slice(0, 6);
    return [...spots, ...splurgeSpots, ...closed];
  }, [spots, splurgeSpots, allSpots]);

  const activeSpot = useMemo(() => {
    if (!spotSlug) return null;
    return allSpots.find(s => s.slug === spotSlug || s.name === spotSlug) ?? null;
  }, [spotSlug, allSpots]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && spots.length > 0) {
      console.group("PulseNYC homepage state");
      console.log("Meal context:", mealType);
      console.log("Spots returned (count):", spots.length);
      console.log("Spot summary:", spots.map(s => ({ name: s.name, category: s.category, topPick: s.topPickName })));
      console.groupEnd();
    }
  }, [mealType, spots]);

  useEffect(() => {
    const cached = readLocation();
    if (cached) {
      // An IP-derived location is a guess, not a fact: use its coords to bias
      // results, but NEVER name the neighborhood in the badge (that read as
      // "LIVE · 10:38 PM · GREENPOINT" for fresh visitors). Only gps/manual
      // locations — explicitly set by the user — name a neighborhood.
      const isConfident = cached.source === "gps" || cached.source === "manual";
      setCoords({ lat: cached.lat, lng: cached.lng });
      setLocationStatus("success");
      if (isConfident) {
        setLocationLabel(cached.label ?? "Saved location");
        setIsDefault(false);
        syncNeighborhood(cached.lat, cached.lng, cached.source === "manual" ? "manual" : "gps");
      }
    } else {
      // No persisted location: only NOW may the Times Square fallback fetch.
      setCoords(TIMES_SQUARE);
    }
    const cachedMeal = readCachedMeal();
    if (cachedMeal) setMealType(cachedMeal);

    // Live sync: setting a location on /eat-smart (or anywhere) updates here too
    return subscribeLocation((loc) => {
      setCoords({ lat: loc.lat, lng: loc.lng });
      if (loc.label) setLocationLabel(loc.label);
      setIsDefault(false);
      setLocationStatus("success");
    });
  }, []);

  // Stale-response guard: every fetch gets an incrementing id and aborts the
  // in-flight request. A response may only touch state if its id is still the
  // latest — the LAST location/meal/filter change owns the UI, not whichever
  // response happens to resolve last.
  const fetchSeq = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const fetchResults = useCallback(async (lat: number, lng: number, meal: MealCategory) => {
    const reqId = ++fetchSeq.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setFetchError(false);
    trackEvent("find_food_search", { meta: { meal } });
    try {
      const res = await fetchWithTimeout(`/api/smart-menu/near-me?lat=${lat}&lng=${lng}&meal=${meal}`, { signal: controller.signal });
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      const restaurants: ApiRestaurant[] = data.restaurants || [];

      const mapped: ResultSpot[] = restaurants.map(r => {
        const topPick = r.topPicks[0];
        return {
          slug: r.slug,
          name: r.restaurantName,
          walkMinutes: r.walkMinutes,
          topPickName: topPick?.name ?? "",
          topPickProtein: topPick?.protein ?? 0,
          topPickCalories: topPick?.calories ?? 0,
          topPickScore: topPick?.pulseScore ?? 0,
          topPickPrice: topPick?.estPrice ?? null,
          topPicks: r.topPicks,
          bestDrink: r.bestDrink ?? null,
          priceRange: r.priceRange,
          priceTier: r.priceTier,
          lat: r.lat,
          lng: r.lng,
          address: r.address,
          grade: r.grade,
          inspectedAt: r.inspectedAt ?? null,
          isGeneric: r.isGeneric,
          category: r.category,
          locationCount: r.locationCount ?? 1,
          otherLocations: r.otherLocations ?? [],
          orderingTip: r.orderingTip,
          verifiedBadge: r.verifiedBadge ?? null,
          verifiedAt: r.verifiedAt ?? null,
          verifiedSlug: r.verifiedSlug ?? null,
          openState: r.openState ?? "unknown",
          hoursChip: r.hoursChip ?? null,
          camis: r.camis ?? null,
        };
      });

      if (reqId !== fetchSeq.current) return; // superseded — a newer request owns the UI

      setAllSpots(mapped);
      setResultsOrigin({ lat, lng }); // origin travels with the response, never read at render time
      setFetchedAt(Date.now());
      setTotalCount(restaurants.length);
    } catch {
      if (reqId !== fetchSeq.current) return; // abort of a superseded request is not an error
      setAllSpots([]);
      setTotalCount(0);
      setFetchError(true);
    } finally {
      if (reqId === fetchSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!coords) return; // location store not hydrated yet — never fetch the fallback blindly
    fetchResults(coords.lat, coords.lng, mealType);
  }, [coords, mealType, fetchResults]);

  const handleRequestLocation = useCallback(async () => {
    setLocationStatus("locating");
    setLowConfidenceHood(null);

    const result = await requestBrowserLocation(10_000);

    if (result.status !== "success") {
      setLocationStatus(result.status);
      return;
    }

    const { lat, lng } = result.coords!;
    const hood = findNearestNeighborhood(lat, lng);

    if (result.lowConfidence) {
      // Desktop IP-level accuracy: show the resolved neighborhood and ask the
      // user to confirm instead of silently committing a city-block guess.
      setCoords({ lat, lng });
      setLowConfidenceHood(hood?.name ?? "your area");
      setLocationStatus("success");
      setIsDefault(false);
      setLocationLabel(hood ? `Near ${hood.name}?` : "Near you (approximate)");
      return;
    }

    setCoords({ lat, lng });
    setIsDefault(false);
    setLocationStatus("success");

    const geo = await reverseGeocode(lat, lng);
    const label = geo?.label ?? `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°W`;
    setLocationLabel(label);
    writeLocation({ lat, lng, label, source: "gps", accuracy: result.accuracy });
    syncNeighborhood(lat, lng, "gps");
  }, []);

  const confirmLowConfidence = useCallback(() => {
    if (!coords) return;
    setLowConfidenceHood(null);
    const label = locationLabel.replace(/^Near | \?$|\?$/g, "");
    writeLocation({ lat: coords.lat, lng: coords.lng, label, source: "gps" });
    setLocationLabel(label);
    syncNeighborhood(coords.lat, coords.lng, "gps");
  }, [coords, locationLabel]);

  const handleManualLocation = useCallback(async (query: string, resolvedCoords?: { lat: number; lng: number }) => {
    setLowConfidenceHood(null);
    if (resolvedCoords) {
      const { lat, lng } = resolvedCoords;
      writeLocation({ lat, lng, label: query, source: "manual" });
      setCoords({ lat, lng });
      setLocationLabel(query);
      setIsDefault(false);
      setLocationStatus("success");
      syncNeighborhood(lat, lng, "manual");
      return;
    }

    const isZip = /^\d{5}$/.test(query);
    if (isZip) {
      try {
        const res = await fetch(
          `https://data.cityofnewyork.us/resource/43nn-pn8j.json?$select=avg(latitude) as lat,avg(longitude) as lng&$where=zipcode='${query}'&$limit=1`
        );
        const rows = await res.json();
        if (rows.length > 0 && rows[0].lat && rows[0].lng) {
          const lat = parseFloat(rows[0].lat);
          const lng = parseFloat(rows[0].lng);
          writeLocation({ lat, lng, label: query, source: "manual" });
          setCoords({ lat, lng });
          setLocationLabel(query);
          setIsDefault(false);
          setLocationStatus("success");
          syncNeighborhood(lat, lng, "manual");
          return;
        }
      } catch {}
    }

    const label = query;
    writeLocation({ ...TIMES_SQUARE, label, source: "manual" });
    setLocationLabel(label);
    setIsDefault(false);
    setLocationStatus("success");
  }, []);

  const handleChipToggle = useCallback((id: ChipId) => {
    setActiveChips(prev => {
      const next = new Set(prev);
      if (id === "high-protein") return next;
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleMealChange = useCallback((meal: MealCategory) => {
    setMealType(meal);
    try { localStorage.setItem(MEAL_LS_KEY, meal); } catch {}
  }, []);

  const handleSpotClick = useCallback((slug: string) => {
    trackEvent("result_card_click", { meta: { slug } });
    const params = new URLSearchParams(window.location.search);
    params.set("spot", slug);
    setSpotSlug(slug);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router]);

  const handleModalClose = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    params.delete("spot");
    setSpotSlug(null);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "/", { scroll: false });
  }, [router]);

  return (
    <>
      <div>
          <WedgeHero under15Count={loading || fetchError ? null : spots.length} />
          <WedgeSearch
            locationLabel={locationLabel}
            onRequestLocation={handleRequestLocation}
            onManualLocation={handleManualLocation}
            locationStatus={locationStatus}
          />
          {/* Social proof — verifiable numbers only: 30 chains in eatSmartData,
              27,678 distinct graded restaurants in DOHMH 43nn-pn8j (July 2026).
              In-person verification is scoped to the LIC guide set, so the claim
              is qualified — we never claim in-person verification city-wide. */}
          <p className="text-center text-[11px] text-[#8A8F8A] mt-2 px-4">
            30 chains with full nutrition · LIC menus verified in person · 27,000+ NYC restaurants rated
          </p>
          {lowConfidenceHood && (
            <div className="max-w-[1100px] mx-auto px-4 sm:px-8 mt-2">
              <div className="flex flex-wrap items-center gap-2 bg-[#FBF6E8] border border-[#F0E3B5] rounded-xl px-3 py-2 text-[12px] text-[#8A6A1C]">
                <span>Your location looks approximate — are you near <strong>{lowConfidenceHood}</strong>?</span>
                <button type="button" onClick={confirmLowConfidence} className="font-semibold text-[#2F8F4D] hover:underline">
                  Yes, use it
                </button>
                <span className="text-[#C9BD96]">·</span>
                <span>or enter an address above for exact results</span>
              </div>
            </div>
          )}
          <MealTypeToggle active={mealType} onChange={handleMealChange} />
          <QuickFilterChips active={activeChips} onToggle={handleChipToggle} />
          <LiveResultsStrip
            spots={spots}
            splurgeSpots={activeChips.has("under-15") ? [] : splurgeSpots}
            totalCount={totalCount}
            isDefault={isDefault}
            locationLabel={locationLabel}
            loading={loading}
            mealLabel={mealType === "coffee" ? "Coffee" : mealType === "breakfast" ? "Breakfast" : mealType === "lunch" ? "Lunch" : mealType === "dinner" ? "Dinner" : "Snack"}
            onSpotClick={handleSpotClick}
            fetchedAt={fetchedAt}
            sortBy={sortBy}
            onSortChange={setSortBy}
            fetchError={fetchError}
            onRetry={() => coords && fetchResults(coords.lat, coords.lng, mealType)}
          />

          {/* Waitlist — THE primary email capture, shown contextually after a
              successful result set (weekly digest merged into its confirmation) */}
          {!loading && spots.length > 0 && (
            <div className="mt-10">
              <p className="text-center text-[15px] font-semibold text-[#1A1A1A] mb-3">
                Take this with you — the app ships Q3 2026
              </p>
              <AppWaitlistCapture />
            </div>
          )}

          {/* 3-block radius local map */}
          {/* Map centers on the origin that PRODUCED these results — never the
              live store value, which may already point somewhere newer */}
          {!loading && spots.length > 0 && resultsOrigin && (
            <div className="max-w-[1100px] mx-auto px-4 sm:px-8 mt-8 mb-8">
              <LocalMap
                center={resultsOrigin}
                spots={mapSpots}
                isDefault={isDefault}
                onSpotClick={handleSpotClick}
                onVisible={() => setMapVisible(true)}
                visible={mapVisible}
              />
            </div>
          )}
      </div>

      {spotSlug && (
        <SpotModal
          spot={activeSpot}
          onClose={handleModalClose}
          meal={mealType}
        />
      )}
    </>
  );
}
