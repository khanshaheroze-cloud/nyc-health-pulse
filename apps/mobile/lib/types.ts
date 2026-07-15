/* ── The frozen near-me API contract ─────────────────────────────────────────
 * Generated July 14 2026 from LIVE production responses (cells 40.7446,-73.9487
 * and 40.7455,-73.9180) against the FINAL-frozen web surface — see
 * APP-FREEZE-REPORT.md at the repo root. The app renders server intelligence;
 * it never re-derives venue truth client-side.
 *
 * GET https://pulsenyc.app/api/smart-menu/near-me?lat&lng&meal[&at]
 *   → { restaurants: ApiRestaurant[], excluded: ApiRestaurant[] }
 */

/** Meal params the endpoint accepts. The app's "Late Night" daypart maps to
 *  "snack" (matches the web's late-evening default); UI label stays Late Night. */
export type MealParam = "breakfast" | "lunch" | "coffee" | "snack" | "dinner";

export type OpenState = "open" | "closed" | "unknown";
export type HoursSource = "brand-default" | "verified" | "google" | "api" | "unknown";
export type ChipTone = "open" | "closed" | "unknown";

/** Liveness states (Round 7/8 Places layer). Anything in `excluded[]` carries
 *  a human `livenessLabel` and must NEVER occupy a ranked slot. */
export type Liveness =
  | "places-verified"
  | "dohmh-only"
  | "closed-permanent"
  | "closed-temporary"
  | "unverified-stale"
  | "address-mismatch"
  | "community-closed";

export interface TopPick {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  /** 0–100. Web tone thresholds: green ≥75, amber 50–74, red <50. */
  pulseScore: number;
  /** Estimated order price in dollars; null = unknown (show the ~$ band). */
  estPrice: number | null;
  /** Brand has nothing under the 600-cal display target — label, don't hide. */
  overCalTarget?: boolean;
}

export interface CategoryChip {
  label: string;
  icon: string;
}

export interface HoursChip {
  label: string;
  tone: ChipTone;
}

export interface OtherLocation {
  address: string;
  walkMinutes: number;
  grade: string;
}

export interface ApiRestaurant {
  /** Unique + stable (includes places-bodega ids) — THE list key. */
  restaurantId: string;
  /** NOT unique — all generic venues of one template share it. Never a key. */
  slug: string;
  restaurantName: string;
  cuisine: string;
  priceRange: number; // 1–3
  priceTier: string; // "$" | "$$" | "$$$"
  distance: number; // meters
  walkMinutes: number;
  lat: number;
  lng: number;
  address: string;
  /** DOHMH letter grade, "" when none (Places bodegas are NYS-licensed —
   *  render "NYS retail food store", never a fake grade). */
  grade: string;
  inspectedAt: string | null;
  /** true = template estimates (±15%, "est." labels); false = curated chain
   *  or in-person-verified menu data. */
  isGeneric: boolean;
  category: string;
  topPicks: TopPick[];
  bestDrink: { name: string; calories: number; protein: number } | null;
  locationCount: number;
  otherLocations: OtherLocation[];
  /** Present on guidance-only venues (topPicks: []) and most generics. */
  orderingTip?: string;
  verifiedBadge?: "verified" | "needs-recheck" | null;
  verifiedAt?: string | null;
  verifiedSlug?: string | null;
  /** DOHMH CAMIS — null for Places-sourced bodegas. */
  camis: string | null;
  refinedCategory?: string | null;
  /** Always present on ranked venues (July 14 closeout guarantee). */
  categoryChip?: CategoryChip | null;
  openState: OpenState;
  hoursSource: HoursSource;
  hoursChip: HoursChip;
  liveness?: Liveness;
  livenessCheckedAt?: string | null;
  /** Present ONLY on excluded[] entries — the human reason this venue is
   *  map-only ("Permanently closed — report if wrong", "Unverified — may have
   *  closed", "Listed address may be a commercial kitchen", "Chain convenience
   *  store — not ranked"). */
  livenessLabel?: string | null;
  /** Google place_id — anchor directions to the storefront door. */
  placeId?: string | null;
  matchConfidence?: number | null;
  /** "places" = bodega ingestion path (no DOHMH grade). Default "dohmh". */
  source?: "dohmh" | "places";
}

export interface NearMeResponse {
  restaurants: ApiRestaurant[];
  /** Map-only venues: dimmed pins with livenessLabel. Capped at 6 server-side,
   *  topPicks always stripped. NEVER render these as ranked cards. */
  excluded: ApiRestaurant[];
}
