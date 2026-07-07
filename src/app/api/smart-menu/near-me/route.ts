import { NextRequest, NextResponse } from "next/server";
import { CHAINS, type MenuItem as ChainMenuItem } from "@/lib/restaurantData";
import { inferMealType, mealMatches, type MealCategory } from "@/lib/inferMealType";
import { matchGenericCategory, templateByCuisineKey, displayCuisine, type GenericTemplate, type GenericPick } from "@/lib/genericRestaurants";
import { classificationOverride } from "@/lib/venueClassification";
import { canonicalBrand, normalizeVenueName, healthyPickEligibility, classifyOrgVenue } from "@/lib/venue-normalize";
import { snapCoords, snapPadMeters, GRID_FINE } from "@/lib/geoSnap";
import { getVenueByCamis, badgeState, type BadgeState } from "@/lib/verifiedVenues";
import { chainHours, parseVerifiedHours, evaluateOpen, hoursChip, type OpenState, type VenueHours } from "@/lib/hours";
import { orderPicks, applyCalDisplayRule } from "@/lib/pickRanking";
import { isDessertBrand, classifyBar, barChipLabel } from "@/lib/venuePolicy";
import { chainTypicalPrice } from "@/lib/chainPrices";
import { getPlacesProvider } from "@/lib/places";
import { computeLiveness, livenessLabel, RANKED_EXCLUDED_LIVENESS, type Liveness } from "@/lib/liveness";
import { fetchCommunityClosed, isCommunityClosed } from "@/lib/communityClosed";

export const dynamic = "force-dynamic";

const NON_FOOD_VENUE_RE = /\b(golf|bowling|cinema|theatre|theater|gym|fitness|coworking|workspace|co-work|members?\s*club|club\s*lounge|axe\s*throw|escape\s*room|trampoline|laser\s*tag|arcade|batting\s*cage|billiard|pool\s*hall|hookah|karaoke|night\s*club|strip\s*club|gentlemen|tattoo|spa\b(?!ghetti)|nail\s*salon|barber|beauty|laundromat|dry\s*clean|self.?storage|parking|gas\s*station)\b/i;

const COFFEE_ALLOWED_CATS = new Set(["cafe", "café", "deli", "sandwiches", "bagels"]);
const COFFEE_ALLOWED_CHAIN_CATS = new Set(["Coffee & Bakery"]);

const BODEGA_CLASS_KEYS = new Set(["deli", "halal"]);

function isPrimaryFoodVenue(dba: string, cuisine: string): boolean {
  if (process.env.PULSENYC_VENUE_GATE === "off") return true;
  if (NON_FOOD_VENUE_RE.test(dba)) return false;
  return true;
}

// Dev-only audit trail: every venue kept out of ranked picks, with the reason —
// so future audits can see exactly what the eligibility gate is doing.
function logExclusion(dba: string | undefined, reason: string | undefined) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[smart-menu] excluded "${dba ?? "?"}" — ${reason ?? "unspecified"}`);
  }
}

function priceTierLabel(priceRange: number): string {
  if (priceRange <= 1) return "$";
  if (priceRange <= 2) return "$$";
  return "$$$";
}

const SNACK_FULL_MEAL_RE = /\b(entrees?|plates?|platters?|dinners?|combos?|family\s*size)\b/i;
const UNHEALTHY_SNACK_RE = /\b(glazed\s*donut|frosted\s*donut|cheese\s*danish|cinnamon\s*roll|chocolate\s*croissant)\b/i;

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pulseScore(item: ChainMenuItem): number {
  let score = 0;
  const ratio = item.protein > 0 ? item.cal / item.protein : Infinity;
  if (ratio <= 7) score += 55;
  else if (ratio <= 10) score += 50;
  else if (ratio <= 14) score += 43;
  else if (ratio <= 18) score += 32;
  else if (ratio <= 25) score += 20;
  else if (ratio <= 35) score += 12;

  if (item.protein >= 40) score += 15;
  else if (item.protein >= 30) score += 12;
  else if (item.protein >= 20) score += 6;
  else if (item.protein >= 10) score += 3;

  if (item.fiber != null && item.cal > 0) {
    const fiberPer100 = (item.fiber / item.cal) * 100;
    if (fiberPer100 >= 2.5) score += 18;
    else if (fiberPer100 >= 1.5) score += 14;
    else if (fiberPer100 >= 0.8) score += 10;
    else if (fiberPer100 >= 0.4) score += 4;
  }

  if (item.cal <= 300) score += 15;
  else if (item.cal <= 450) score += 12;
  else if (item.cal <= 600) score += 8;
  else if (item.cal <= 800) score += 4;

  if (item.sodium > 1800) score -= 6;
  else if (item.sodium > 1500) score -= 3;
  else if (item.sodium > 1200) score -= 1;

  const addedSugar = item.sugar ?? 0;
  if (addedSugar > 20) score -= 6;
  else if (addedSugar > 12) score -= 3;
  else if (addedSugar > 6) score -= 1;

  return Math.max(0, Math.min(100, score));
}

// Brand matching lives in src/lib/venue-normalize.ts (canonicalBrand) — one
// alias map shared by every surface, covering DOHMH misspellings like
// "CHIPOTLE MEXCIAN GRILL # 2760".
function matchChain(dba: string): string | null {
  return canonicalBrand(dba)?.slug ?? null;
}

const BEVERAGE_RE = /\b(latte|cappuccino|espresso|americano|matcha|cold.?brew|drip coffee|chai|macchiato|mocha|frappuccino|refresher|hot.?chocolate|hot.?cocoa)\b/i;
const STRICT_BREAKFAST_RE = /\b(egg.?(and|&).?cheese|breakfast (wrap|burrito|sandwich|taco)|pancakes?|waffles?|french.?toast|hash.?browns?|biscuits?|omelets?|omelettes?|hotcakes|egg.?whites?.*(wrap|sandwich)|bagels?.*(cream|cheese)|mcmuffin|scrambled?)\b/i;
const ALL_DAY_BREAKFAST_CATS = new Set(["deli", "diner", "cafe", "café"]);

function applyMealGuards(name: string, protein: number, cal: number, activeMeal: MealCategory, categoryKey: string, sugar?: number): boolean {
  if (BEVERAGE_RE.test(name)) {
    if (activeMeal === "lunch" || activeMeal === "dinner") return false;
    if (activeMeal !== "coffee" && protein < 5) return false;
  }
  if (activeMeal === "lunch" || activeMeal === "dinner" || activeMeal === "snack") {
    if (STRICT_BREAKFAST_RE.test(name) && !ALL_DAY_BREAKFAST_CATS.has(categoryKey.toLowerCase())) return false;
  }
  if (activeMeal === "snack") {
    if (cal > 450) return false;
    if (protein > 25) return false;
    if (SNACK_FULL_MEAL_RE.test(name)) return false;
    if (UNHEALTHY_SNACK_RE.test(name)) return false;
    if (sugar != null && sugar > 20 && protein < 5) return false;
  }
  if (activeMeal === "coffee") {
    if (protein >= 15 && cal >= 400) return false;
  }
  if ((activeMeal === "lunch" || activeMeal === "dinner") && cal < 250 && protein < 10) return false;
  return true;
}

function mealFilterFn(meal: string): (item: ChainMenuItem) => boolean {
  const activeMeal = meal as MealCategory;
  return (item) => {
    const inferred = inferMealType(item.name, item.tags);
    if (!mealMatches(inferred, activeMeal)) {
      if (!(activeMeal === "snack" && item.cal <= 300 && inferred !== "lunch" && inferred !== "dinner")) return false;
    }
    return applyMealGuards(item.name, item.protein, item.cal, activeMeal, "", item.sugar);
  };
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Every generic template is a $/$$ venue feeding an under-$15 product: a
// template pick priced over $15 can never headline (July 5 audit: "$16 est."
// rendered 400px under the "under $15" hero). Coherent picks under the cap
// are always preferred; if none survive, the card falls back to guidance.
const TEMPLATE_PRICE_CAP = 15;

function filterGenericPicks(picks: GenericPick[], meal: string, category: string, seed: number = 0): GenericPick[] {
  const activeMeal = meal as MealCategory;
  const catKey = category.toLowerCase();
  const scored = picks
    .filter(p => p.estimatedPrice == null || p.estimatedPrice <= TEMPLATE_PRICE_CAP)
    .filter(p => applyMealGuards(p.name, p.protein, p.cal, activeMeal, catKey))
    .map(p => {
      const inferred = inferMealType(p.name, undefined, category);
      let priority = 0;
      if (inferred === activeMeal) priority = 2;
      else if (mealMatches(inferred, activeMeal)) priority = 1;
      return { pick: p, priority };
    });

  // No cuisine-coherent pick for this meal: return none — the venue card
  // renders "Smart ordering tips" guidance instead of an incoherent dish.
  if (scored.length === 0) return [];

  scored.sort((a, b) => b.priority - a.priority);
  const result: GenericPick[] = [];
  const maxPri = scored[0].priority;

  // Meal-coherence guard: if the best pick still doesn't belong to the active
  // meal (priority 0 = neither an exact nor a compatible match), surface NONE —
  // a dinner lasagna must never headline the Breakfast tab. The card falls back
  // to ordering guidance.
  if (maxPri === 0) return [];
  const topTier = scored.filter(s => s.priority === maxPri);
  const rest = scored.filter(s => s.priority < maxPri);

  const offset = seed % topTier.length;
  for (let i = 0; i < Math.min(3, topTier.length); i++) {
    result.push(topTier[(offset + i) % topTier.length].pick);
  }
  if (result.length < 3 && rest.length > 0) {
    const nextPri = rest[0].priority;
    const nextBatch = rest.filter(s => s.priority === nextPri);
    const rOff = seed % nextBatch.length;
    for (let i = 0; result.length < 3 && i < nextBatch.length; i++) {
      result.push(nextBatch[(rOff + i) % nextBatch.length].pick);
    }
  }
  return result;
}

interface DOHMHRow {
  camis?: string;
  dba?: string;
  cuisine_description?: string;
  grade?: string;
  building?: string;
  street?: string;
  boro?: string;
  latitude?: string;
  longitude?: string;
  inspection_date?: string;
}

interface TopPick {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  pulseScore: number;
  /** Estimated price of this order in dollars; null = unknown (UI shows the ~$ band) */
  estPrice: number | null;
  /** True when this brand has nothing under the 600-cal display target — the
   *  UI labels it instead of silently showing a 780-cal "top pick" */
  overCalTarget?: boolean;
}

interface ApiResult {
  restaurantId: string;
  slug: string;
  restaurantName: string;
  cuisine: string;
  priceRange: number;
  priceTier: string;
  distance: number;
  walkMinutes: number;
  lat: number;
  lng: number;
  address: string;
  grade: string;
  inspectedAt: string | null;
  isGeneric: boolean;
  category: string;
  topPicks: TopPick[];
  /** Best beverage, surfaced separately so a 5-cal cold brew can't headline */
  bestDrink: { name: string; calories: number; protein: number } | null;
  /** Same-brand locations within the radius collapsed into this card */
  locationCount: number;
  otherLocations: { address: string; walkMinutes: number; grade: string }[];
  /** Generic-template ordering guidance shown when no coherent pick exists */
  orderingTip?: string;
  /** Set when this venue has an in-person-verified menu (the data moat) */
  verifiedBadge?: BadgeState | null;
  verifiedAt?: string | null;
  /** Slug of the real /restaurants/{slug} detail page (verified venues only) */
  verifiedSlug?: string | null;
  /** DOHMH CAMIS id — the shareable /spot/[venueId] key for real venues. */
  camis?: string | null;
  /** Round 7 liveness — Google Places is the liveness source of truth.
   *  Gated states (closed/stale/mismatch) never occupy a ranked slot. */
  liveness?: Liveness;
  /** When Places last confirmed this venue (confident matches only) */
  livenessCheckedAt?: string | null;
  /** Dimmed-map label for liveness-gated venues; absent for rankable ones */
  livenessLabel?: string | null;
  /** Google place_id (confident matches) — anchors directions to the door */
  placeId?: string | null;
  matchConfidence?: number | null;
  /** Open/closed at query time. "unknown" when we have no hours source. */
  openState: OpenState;
  /** Where the hours came from: brand-default | verified | api | unknown */
  hoursSource: VenueHours["source"];
  /** Chip label + tone for the UI ("Open now" / "Closed · opens 7am" / "Hours unknown") */
  hoursChip: { label: string; tone: "open" | "closed" | "unknown" };
}

// The only params this endpoint reads. Anything else (e.g. a probing
// `&sort=calories` — sorting is client-side) is ignored: the request is
// answered normally, never altered or slowed by unknown params (July 6 audit).
const KNOWN_PARAMS = new Set(["lat", "lng", "meal", "at"]);
const KNOWN_MEALS = new Set(["breakfast", "lunch", "coffee", "snack", "dinner"]);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    for (const key of searchParams.keys()) {
      if (!KNOWN_PARAMS.has(key) && process.env.NODE_ENV !== "production") {
        console.log(`[smart-menu] ignoring unknown param "${key}"`);
      }
    }
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const mealParam = searchParams.get("meal") || "lunch";
    const meal = KNOWN_MEALS.has(mealParam) ? mealParam : "lunch";
    // The "When" selector evaluates hours at the SELECTED time, not always now.
    // `at` is epoch millis; falls back to server now.
    const atParam = searchParams.get("at");
    const when = atParam && /^\d+$/.test(atParam) ? new Date(parseInt(atParam, 10)) : new Date();

    if (!lat || !lng) {
      return NextResponse.json({ error: "lat and lng required", restaurants: [] }, { status: 400 });
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    // Snapped query center → shared Next data-cache entry for everyone in the
    // same ~500m cell; padded radius + true-distance filter keep results exact
    const RADIUS_M = 800;
    const snapped = snapCoords(latNum, lngNum, GRID_FINE);
    const paddedRadius = RADIUS_M + snapPadMeters(GRID_FINE);
    const where = `within_circle(location, ${snapped.lat}, ${snapped.lng}, ${paddedRadius}) AND grade IN('A','B')`;
    const url = `https://data.cityofnewyork.us/resource/43nn-pn8j.json?$where=${encodeURIComponent(where)}&$select=camis,dba,cuisine_description,grade,building,street,boro,latitude,longitude,inspection_date&$limit=800&$order=grade ASC`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    const rawRows: DOHMHRow[] = res.ok ? await res.json() : [];

    // DOHMH returns one row per inspection(×violation). Collapse to the most
    // recent graded inspection per venue BEFORE ranking — first-row-wins was
    // showing R40's Apr 2023 inspection instead of its Apr 2026 grade (July 5
    // audit). The query already filters grade IN('A','B'), so the max-date row
    // per venue is the latest graded one.
    const byVenue = new Map<string, DOHMHRow>();
    for (const r of rawRows) {
      const key = r.camis || `${r.dba}-${r.building}-${r.street}`;
      const prev = byVenue.get(key);
      if (!prev || (r.inspection_date ?? "") > (prev.inspection_date ?? "")) byVenue.set(key, r);
    }
    const rows = [...byVenue.values()];

    const filterFn = mealFilterFn(meal);
    const chainResults: ApiResult[] = [];
    const genericResults: ApiResult[] = [];
    const seenKeys = new Set<string>();

    let venueGateExcluded = 0;

    for (const r of rows) {
      const rLat = parseFloat(r.latitude || "0");
      const rLng = parseFloat(r.longitude || "0");
      if (rLat === 0) continue;

      if (!isPrimaryFoodVenue(r.dba || "", r.cuisine_description || "")) {
        venueGateExcluded++;
        logExclusion(r.dba, "non-food venue (name pattern)");
        continue;
      }

      // Dessert/bubble-tea brands never occupy ranked pick slots — checked
      // BEFORE brand matching because Tiger Sugar/Kung Fu Tea are curated
      // chains, and before cuisine because DOHMH licenses Mango Mango as
      // "Fruits/Vegetables" (July 5 audit, P0).
      if (isDessertBrand(r.dba || "")) {
        venueGateExcluded++;
        logExclusion(r.dba, "dessert/bubble-tea brand");
        continue;
      }

      const address = [r.building, r.street, r.boro].filter(Boolean).join(" ");
      const distMeters = haversine(latNum, lngNum, rLat, rLng);
      if (distMeters > RADIUS_M) continue; // outside the user's true radius (snap padding)
      const walkMinutes = Math.round(distMeters / 80);

      const chainSlug = matchChain(r.dba || "");

      if (chainSlug) {
        const key = `${chainSlug}-${r.building}-${r.street}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);

        const chain = CHAINS.find((c) => c.slug === chainSlug);
        if (!chain) continue;

        if (meal === "coffee" && !COFFEE_ALLOWED_CHAIN_CATS.has(chain.category)) continue;

        const activeMeal = meal as MealCategory;
        // Pure PulseScore ordering (strict meal-match only breaks ties) — the
        // card says "ranked by PulseScore", so a strictness bonus must never
        // put a 65 above an 80 (July 5 audit, P0).
        const scoredAll = chain.items
          .filter(filterFn)
          .map((item) => {
            const ps = pulseScore(item);
            const strict = inferMealType(item.name, item.tags) === activeMeal;
            return {
              pick: {
                id: `${chainSlug}-${item.name.replace(/\s+/g, "-").toLowerCase()}`,
                name: item.name,
                calories: item.cal,
                protein: item.protein,
                carbs: item.carbs,
                fat: item.fat,
                fiber: item.fiber ?? 0,
                pulseScore: ps,
                // Brand-level typical-price band (src/data/chain-prices.json):
                // every ranked card shows a price and the under-$15 cap logic
                // covers chains (round 5 — null exempted them).
                estPrice: chainTypicalPrice(chainSlug),
              },
              strict,
            };
          })
          .sort((a, b) => b.pick.pulseScore - a.pick.pulseScore || Number(b.strict) - Number(a.strict))
          .map((s) => s.pick);

        if (scoredAll.length === 0) continue;

        // Headline rule: for breakfast/lunch/dinner the "best order" must be a
        // real MEAL (>=200 cal, not a beverage OR side — round 5 extends the
        // round-2 drink rule). Drinks surface separately as bestDrink. The
        // 600-cal display rule drops over-target items from ranked cards when
        // the brand has anything under target (BWW's 780-cal Caesar stays on
        // the chain's full menu page, never in the ranked card).
        const drinks = scoredAll.filter((s) => BEVERAGE_RE.test(s.name));
        const candidates = meal === "coffee" || meal === "snack"
          ? scoredAll
          : scoredAll.filter((s) => !BEVERAGE_RE.test(s.name));
        const scored: TopPick[] = orderPicks(applyCalDisplayRule(candidates), activeMeal).slice(0, 3);
        if (scored.length === 0) {
          logExclusion(r.dba, "no coherent meal pick for this tab (chain)");
          continue;
        }
        const bestDrink = meal !== "coffee" && drinks.length > 0
          ? { name: drinks[0].name, calories: drinks[0].calories, protein: drinks[0].protein }
          : null;

        const chHours = chainHours(chainSlug, chain.category);
        const chState = evaluateOpen(chHours, when);
        chainResults.push({
          restaurantId: `${chainSlug}-${rLat.toFixed(4)}`,
          slug: chainSlug,
          restaurantName: chain.name,
          cuisine: chain.category,
          priceRange: chain.priceRange,
          priceTier: priceTierLabel(chain.priceRange),
          distance: Math.round(distMeters),
          walkMinutes,
          lat: rLat,
          lng: rLng,
          address,
          grade: r.grade || "",
          inspectedAt: r.inspection_date ?? null,
          isGeneric: false,
          category: chain.category,
          topPicks: scored,
          bestDrink,
          locationCount: 1,
          otherLocations: [],
          camis: r.camis ?? null,
          openState: chState,
          hoursSource: chHours.source,
          hoursChip: hoursChip(chState, chHours, when),
        });
      } else {
        // Bars, lounges, dessert-only, hotel kitchens never make ranked
        // healthy picks (brand-matched venues were handled above and are
        // exempt). They remain findable in the full map view (/api/nearby-food).
        const elig = healthyPickEligibility(r.dba || "", r.cuisine_description || "", false, meal);
        if (!elig.eligible) {
          venueGateExcluded++;
          logExclusion(r.dba, elig.reason);
          continue;
        }

        // ── Verified-venue match (the data moat) ────────────────────────
        // In-person-verified menus replace template estimates entirely: real
        // dish names, real prices, real macros, and a working detail page.
        const vv = r.camis ? getVenueByCamis(r.camis) : undefined;
        if (vv && vv.verification.status === "verified" && vv.menuItems.length > 0) {
          const vKey = `verified-${vv.slug}`;
          if (seenKeys.has(vKey)) continue;
          seenKeys.add(vKey);

          // PulseScore first (the card's stated ranking), the in-person
          // isRecommended flag breaks ties. Headline must still be a meal.
          const rankedPicks = [...vv.menuItems]
            .map((m, i) => ({
              id: `${vv.slug}-verified-${i}`,
              name: m.name,
              calories: m.calories ?? 0,
              protein: m.protein ?? 0,
              carbs: m.carbs ?? 0,
              fat: m.fat ?? 0,
              fiber: 0,
              pulseScore: pulseScore({
                name: m.name,
                cal: m.calories ?? 0,
                protein: m.protein ?? 0,
                fat: m.fat ?? 0,
                carbs: m.carbs ?? 0,
                sodium: m.sodium ?? 0,
              } as ChainMenuItem),
              estPrice: m.price,
              _rec: m.isRecommended,
            }))
            .sort((a, b) => b.pulseScore - a.pulseScore || Number(b._rec) - Number(a._rec))
            .map(({ _rec, ...rest }) => rest);
          const vvPicks: TopPick[] = orderPicks(applyCalDisplayRule(rankedPicks), meal as MealCategory).slice(0, 3);

          const vvHours = parseVerifiedHours(vv.hours);
          const vvState = evaluateOpen(vvHours, when);
          chainResults.push({
            restaurantId: vv.id,
            slug: vv.slug,
            restaurantName: vv.name,
            cuisine: vv.venueType,
            priceRange: vv.priceBand ?? 2,
            priceTier: priceTierLabel(vv.priceBand ?? 2),
            distance: Math.round(distMeters),
            walkMinutes,
            lat: rLat,
            lng: rLng,
            address,
            grade: r.grade || vv.dohmhGrade || "",
            inspectedAt: r.inspection_date ?? vv.dohmhInspectedAt,
            isGeneric: false,
            category: vv.venueType,
            topPicks: vvPicks,
            bestDrink: null,
            locationCount: 1,
            otherLocations: [],
            verifiedBadge: badgeState(vv.verification),
            verifiedAt: vv.verification.verifiedAt,
            verifiedSlug: vv.slug,
            camis: r.camis ?? null,
            openState: vvState,
            hoursSource: vvHours.source,
            hoursChip: hoursChip(vvState, vvHours, when),
          });
          continue;
        }
        // Matched but not yet menu-verified: use the curated clean name, keep
        // template picks, no badge, no detail link.
        const cleanName = vv?.name;

        // Per-venue classification override wins over DOHMH cuisine (fixes
        // Maman/"French" → pizza+lasagna). "none" forces guidance-only.
        const override = classificationOverride(cleanName ?? r.dba ?? "");
        const template = override
          ? templateByCuisineKey(override)
          : matchGenericCategory(r.cuisine_description || "");
        if (!template) continue;

        if (meal === "coffee" && !COFFEE_ALLOWED_CATS.has(template.cuisineKey)) continue;

        const addrKey = `generic-${template.cuisineKey}-${r.building}-${r.street}`;
        if (seenKeys.has(addrKey)) continue;
        seenKeys.add(addrKey);

        const dba = cleanName ?? normalizeVenueName(r.dba || template.category);
        const seed = hashStr(dba + (r.building || "") + (r.street || ""));

        const filteredPicks = filterGenericPicks(template.picks, meal, template.category, seed);
        // Seed rotation decides WHICH picks a venue shows (variety across
        // venues sharing a template); orderPicks decides their ORDER — score
        // descending, meal headline (Woodbines must lead with Roast Chicken 80,
        // not Pasta 45; Tamashii must never headline Edamame).
        const topPicks: TopPick[] = orderPicks(
          applyCalDisplayRule(
            filteredPicks.map((p, i) => ({
              id: `${template.cuisineKey}-generic-${seed}-${i}`,
              name: p.name,
              calories: p.cal,
              protein: p.protein,
              carbs: 0,
              fat: 0,
              fiber: 0,
              pulseScore: p.protein >= 30 ? 80 : p.protein >= 20 ? 65 : p.protein >= 10 ? 45 : 30,
              estPrice: p.estimatedPrice ?? null,
            })),
          ),
          meal as MealCategory,
        );

        // Generic template = no real venue identity, so hours are unknown.
        // Allowed in picks, but the card shows "Hours unknown", never "open".
        const genState: OpenState = "unknown";
        // Chip tells the truth about the VENUE (DOHMH cuisine), not the pick
        // template (Havana Central is Cuban, not "Mexican" — July 5 audit).
        // Ranked food-forward bars say so: Woodbines is a "Gastropub", not a
        // "Diner" (its Irish cuisine borrows the diner template).
        const barChip = classifyBar(r.dba || "", r.cuisine_description || "") === "food-forward-bar"
          ? barChipLabel(r.dba || "")
          : null;
        const venueCuisine = barChip ?? (displayCuisine(r.cuisine_description || "") || template.category);
        genericResults.push({
          restaurantId: `generic-${template.cuisineKey}-${rLat.toFixed(4)}`,
          slug: `generic-${template.cuisineKey}`,
          restaurantName: dba,
          cuisine: venueCuisine,
          priceRange: template.priceRange,
          priceTier: priceTierLabel(template.priceRange),
          distance: Math.round(distMeters),
          walkMinutes,
          lat: rLat,
          lng: rLng,
          address,
          grade: r.grade || "",
          inspectedAt: r.inspection_date ?? null,
          isGeneric: true,
          category: barChip ?? template.category,
          topPicks,
          bestDrink: null,
          locationCount: 1,
          otherLocations: [],
          orderingTip: template.orderingTip,
          camis: r.camis ?? null,
          openState: genState,
          hoursSource: "unknown",
          hoursChip: hoursChip(genState, null, when),
        });
      }
    }

    // ── Brand dedupe: collapse same-brand venues into one card ─────────────
    // "Dunkin' · 4 locations nearby · nearest 2 blocks" instead of four
    // identical Dunkin' cards. Nearest location is the primary.
    const byBrand = new Map<string, ApiResult[]>();
    for (const r of chainResults) {
      const group = byBrand.get(r.slug);
      if (group) group.push(r);
      else byBrand.set(r.slug, [r]);
    }
    chainResults.length = 0;
    for (const group of byBrand.values()) {
      group.sort((a, b) => a.distance - b.distance);
      const primary = group[0];
      primary.locationCount = group.length;
      primary.otherLocations = group.slice(1, 6).map((g) => ({
        address: g.address,
        walkMinutes: g.walkMinutes,
        grade: g.grade,
      }));
      chainResults.push(primary);
    }

    chainResults.sort((a, b) => a.distance - b.distance);
    genericResults.sort((a, b) => a.distance - b.distance);

    // A venue with NO coherent picks can never occupy a ranked slot (July 5
    // audit: Mango Mango ranked with topPicks: [] and a boilerplate café tip).
    // Guidance-only venues are still returned — appended after the ranked
    // candidates so the client renders them below the ranked set, unranked.
    const guidanceOnly = genericResults.filter((r) => r.topPicks.length === 0);
    const rankableGenerics = genericResults.filter((r) => r.topPicks.length > 0);
    genericResults.length = 0;
    genericResults.push(...rankableGenerics);

    // Interleave: aim for 2+ generics in the top 5 when available
    const mixed: ApiResult[] = [];
    let ci = 0, gi = 0;
    const seenSlugs = new Set<string>();

    // Take closest generic first, then alternate
    while (mixed.length < 10 && (ci < chainResults.length || gi < genericResults.length)) {
      const genericCount = mixed.filter(r => r.isGeneric).length;
      const chainCount = mixed.filter(r => !r.isGeneric).length;

      // Prefer generic if we need more to reach the 2-minimum target within first 5
      const needMoreGeneric = genericCount < 2 && mixed.length < 5 && gi < genericResults.length;
      const needMoreChain = chainCount < 2 && mixed.length < 5 && ci < chainResults.length;

      let pickGeneric: boolean;
      if (needMoreGeneric && !needMoreChain) {
        pickGeneric = true;
      } else if (needMoreChain && !needMoreGeneric) {
        pickGeneric = false;
      } else if (gi < genericResults.length && ci < chainResults.length) {
        pickGeneric = genericResults[gi].distance <= chainResults[ci].distance;
      } else {
        pickGeneric = gi < genericResults.length;
      }

      if (pickGeneric && gi < genericResults.length) {
        const spot = genericResults[gi++];
        const dedup = `${spot.category}-${spot.address}`;
        if (!seenSlugs.has(dedup)) {
          seenSlugs.add(dedup);
          mixed.push(spot);
        }
      } else if (ci < chainResults.length) {
        const spot = chainResults[ci++];
        if (!seenSlugs.has(spot.slug + "-" + spot.address)) {
          seenSlugs.add(spot.slug + "-" + spot.address);
          mixed.push(spot);
        }
      } else {
        break;
      }
    }

    const deduped: ApiResult[] = [];
    const seenPicks = new Set<string>();
    for (const spot of mixed) {
      if (spot.topPicks.length > 0) {
        const pickKey = `${spot.topPicks[0].name}-${spot.topPicks[0].calories}`;
        if (seenPicks.has(pickKey) && spot.isGeneric) continue;
        seenPicks.add(pickKey);
      }
      deduped.push(spot);
    }

    // Forced bodega minimum: guarantee ≥1 deli/halal in results (except coffee mode)
    if (meal !== "coffee") {
      const hasBodega = deduped.some(r => r.isGeneric && BODEGA_CLASS_KEYS.has(r.slug.replace("generic-", "")));
      if (!hasBodega) {
        const bodegaCandidate = genericResults.find(r => {
          const key = r.slug.replace("generic-", "");
          return BODEGA_CLASS_KEYS.has(key) && !deduped.some(d => d.restaurantId === r.restaurantId);
        });
        if (bodegaCandidate) {
          if (deduped.length >= 5) {
            deduped.splice(4, 0, bodegaCandidate);
          } else {
            deduped.push(bodegaCandidate);
          }
        }
      }
    }

    // Ranked candidates first, then up to 3 guidance-only venues (clearly
    // pickless — the client shows them under an "ordering guidance" divider).
    const candidates = [...deduped.slice(0, 10), ...guidanceOnly.slice(0, 3)];

    // ── Liveness gate (Round 7) ─────────────────────────────────────────────
    // Lazy enrichment: ONLY venues that reached the candidate set hit Places
    // (≤13 per query, 7-day cached). A null enrichment = the lookup was not
    // attempted (no key / budget / network) — behavior stays DOHMH-only.
    const provider = getPlacesProvider();
    const communityClosedIndex = await fetchCommunityClosed();
    await Promise.all(
      candidates.map(async (v) => {
        const enrichment = provider.enabled
          ? await provider.enrichVenue({
              key: v.camis ?? v.restaurantId,
              name: v.restaurantName,
              address: v.address,
              lat: v.lat,
              lng: v.lng,
            })
          : null;
        const community = isCommunityClosed(communityClosedIndex, {
          camis: v.camis,
          restaurantId: v.restaurantId,
          name: v.restaurantName,
          address: v.address,
        });
        v.liveness = computeLiveness(enrichment, v.inspectedAt, community);
        if (enrichment?.status === "matched" && enrichment.place) {
          const place = enrichment.place;
          v.placeId = place.placeId;
          v.matchConfidence = enrichment.matchConfidence;
          v.livenessCheckedAt = enrichment.fetchedAt;
          // Storefront geometry beats DOHMH block-face geocoding: pins,
          // distance and walk time recompute from the door, and the display
          // address is the real storefront (the Maman/Austell class of "pin
          // points at a dot" errors). DOHMH lat/lng stays only as fallback.
          v.lat = place.lat;
          v.lng = place.lng;
          const correctedDist = haversine(latNum, lngNum, place.lat, place.lng);
          v.distance = Math.round(correctedDist);
          v.walkMinutes = Math.round(correctedDist / 80);
          if (place.formattedAddress) {
            v.address = place.formattedAddress.replace(/,\s*USA$/, "");
          }
        }
        if (v.liveness === "address-mismatch") {
          // Review trail: a name match beyond the 150m gate is the commissary
          // pattern — never a walkable recommendation (Maman/Austell class).
          console.warn(
            `[places] ADDRESS-MISMATCH: "${v.restaurantName}" (${v.address}) — best Places name match is ${enrichment?.distanceM}m away at "${enrichment?.place?.formattedAddress}". Excluded from ranked; review.`,
          );
        }
      }),
    );

    // Gated venues never rank — they go to the map only, dimmed and labeled.
    const gatedOut = candidates.filter((v) => RANKED_EXCLUDED_LIVENESS.has(v.liveness ?? "dohmh-only"));
    for (const v of gatedOut) v.livenessLabel = livenessLabel(v.liveness!);
    const final = candidates.filter((v) => !RANKED_EXCLUDED_LIVENESS.has(v.liveness ?? "dohmh-only"));

    if (process.env.NODE_ENV !== "production") {
      // Standing tripwire (round 6 — third institutional leak: Fooda →
      // UNFCU/Boyce). Any RANKED venue whose DBA carries a non-food
      // organizational token screams in dev/CI logs so the next leak is
      // caught by the test suite, not an owner audit.
      for (const v of final) {
        const org = classifyOrgVenue(v.restaurantName, v.cuisine);
        if (org.verdict !== "clear") {
          console.warn(
            `[smart-menu] ⚠️ ORG-TOKEN ${org.verdict.toUpperCase()}: ranked venue "${v.restaurantName}" carries token ${org.token} — review before an owner audit finds it`,
          );
        }
      }
      console.log(`[smart-menu] meal=${meal} venueGateExcluded=${venueGateExcluded} chains=${chainResults.length} generic=${genericResults.length} final=${final.length} livenessGated=${gatedOut.length}`);
      const bodegaInFinal = final.filter(r => r.isGeneric && BODEGA_CLASS_KEYS.has(r.slug.replace("generic-", "")));
      if (bodegaInFinal.length > 0) console.log(`[smart-menu] bodega in results: ${bodegaInFinal.map(r => r.restaurantName).join(", ")}`);
    }

    // `excluded` = liveness-gated venues: still shown on the map (dimmed,
    // labeled "Permanently closed — report if wrong" etc), never ranked.
    return NextResponse.json({ restaurants: final, excluded: gatedOut });
  } catch (err) {
    console.error("smart-menu/near-me error:", err);
    return NextResponse.json({ restaurants: [] });
  }
}
