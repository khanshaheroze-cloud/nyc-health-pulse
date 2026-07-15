/* ── Result sectioning + sort/filter — ports the web's WedgeSection semantics
 * (round 4–6, frozen July 14 2026) so app and site rank identically:
 *  - canonical dedupe by restaurantId FIRST; sorting/filtering only ever
 *    re-orders or subsets this array (idempotent — no accumulation)
 *  - known-closed and liveness-labeled venues never rank
 *  - the ranked five are under-$15 ONLY; over-$15 goes to "Worth a splurge";
 *    pickless venues go to "ordering guidance", never ranked
 * Pure module — unit-tested in __tests__/results.test.ts.
 */
import type { ApiRestaurant } from "./types";

export type SortKey = "score" | "protein" | "calories" | "distance" | "protein-per-dollar";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "score", label: "PulseScore" },
  { key: "protein", label: "Protein" },
  { key: "calories", label: "Calories" },
  { key: "distance", label: "Distance" },
  { key: "protein-per-dollar", label: "Protein per $" },
];

export type FilterChip = "high-protein" | "under-15" | "quick" | "open-now";

export interface ResultSections {
  /** The promised five — under-$15 picks only. */
  ranked: ApiRestaurant[];
  /** Over-$15 venues, under an explicit divider (max 3). */
  splurge: ApiRestaurant[];
  /** No coherent picks for this meal — guidance only, never ranked (max 3). */
  guidance: ApiRestaurant[];
}

const topPick = (r: ApiRestaurant) => r.topPicks[0];

/** Known order price wins; unknown falls back to the venue's price band. */
export function isUnder15(r: ApiRestaurant): boolean {
  const price = topPick(r)?.estPrice;
  return price != null ? price <= 15 : r.priceRange <= 2;
}

/** Web wedgeScore: PulseScore with the under-$15 anchor baked in, +2 for
 *  in-person-verified menus. The default order IS "macro-friendly under $15". */
export function wedgeScore(r: ApiRestaurant): number {
  const base = topPick(r)?.pulseScore ?? 0;
  return base + (isUnder15(r) ? 8 : 0) - (r.priceRange >= 3 ? 8 : 0) + (r.verifiedBadge === "verified" ? 2 : 0);
}

function sortBy(list: ApiRestaurant[], key: SortKey): ApiRestaurant[] {
  const sorted = [...list];
  switch (key) {
    case "protein":
      sorted.sort((a, b) => (topPick(b)?.protein ?? 0) - (topPick(a)?.protein ?? 0));
      break;
    case "calories":
      sorted.sort((a, b) => (topPick(a)?.calories || 9999) - (topPick(b)?.calories || 9999));
      break;
    case "distance":
      sorted.sort((a, b) => a.walkMinutes - b.walkMinutes);
      break;
    case "protein-per-dollar":
      sorted.sort(
        (a, b) =>
          (topPick(b)?.protein ?? 0) / Math.max(1, b.priceRange) -
          (topPick(a)?.protein ?? 0) / Math.max(1, a.priceRange),
      );
      break;
    default:
      sorted.sort((a, b) => wedgeScore(b) - wedgeScore(a));
  }
  return sorted;
}

export function sectionResults(
  restaurants: ApiRestaurant[],
  opts: { sort?: SortKey; chips?: Set<FilterChip> } = {},
): ResultSections {
  const chips = opts.chips ?? new Set<FilterChip>();

  // Canonical array: dedupe by venue identity FIRST (web July 6 audit — sort
  // clicks rendered one diner twelve times when keys collided).
  const seen = new Set<string>();
  const canonical = restaurants.filter((r) => {
    const key = r.restaurantId || `${r.restaurantName}-${r.address}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Known-closed and liveness-labeled venues never rank ("right now" must be
  // true). Unknown hours stay rankable — never claimed open, never punished.
  let filtered = canonical.filter((r) => r.openState !== "closed" && !r.livenessLabel);

  if (chips.has("high-protein")) filtered = filtered.filter((r) => (topPick(r)?.protein ?? 0) >= 20);
  if (chips.has("quick")) filtered = filtered.filter((r) => r.walkMinutes <= 5);
  // "Open now" = KNOWN-open only — we never claim open without data.
  if (chips.has("open-now")) filtered = filtered.filter((r) => r.openState === "open");
  if (chips.has("under-15")) filtered = filtered.filter(isUnder15);

  const sorted = sortBy(filtered, opts.sort ?? "score");

  const withPicks = sorted.filter((r) => topPick(r));
  const guidance = sorted.filter((r) => !topPick(r)).slice(0, 3);
  const under15 = withPicks.filter(isUnder15);
  const over15 = withPicks.filter((r) => !isUnder15(r));

  return { ranked: under15.slice(0, 5), splurge: over15.slice(0, 3), guidance };
}

/** Price label parity: exact estimate when known, honest ~$ band when not. */
export function orderPriceLabel(r: ApiRestaurant): string {
  const price = topPick(r)?.estPrice;
  if (price != null) return `~$${price}`;
  if (r.priceRange <= 1) return "~$5–10";
  if (r.priceRange <= 2) return "~$10–15";
  return "~$15+";
}

export function formatWalk(r: ApiRestaurant): string {
  return r.walkMinutes <= 0 ? "<1 min walk" : `${r.walkMinutes} min walk`;
}

/** "Inspected Mar 2026" — null-safe. */
export function inspectedLabel(inspectedAt: string | null | undefined): string | null {
  if (!inspectedAt) return null;
  const d = new Date(inspectedAt);
  if (Number.isNaN(d.getTime())) return null;
  return `Inspected ${d.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
}

/** Google attribution is required wherever Places-sourced content renders. */
export function hasPlacesData(sections: { ranked: ApiRestaurant[]; splurge: ApiRestaurant[]; guidance: ApiRestaurant[] }, excluded: ApiRestaurant[] = []): boolean {
  return [...sections.ranked, ...sections.splurge, ...sections.guidance, ...excluded].some(
    (r) => r.placeId || r.source === "places" || r.hoursSource === "google",
  );
}
