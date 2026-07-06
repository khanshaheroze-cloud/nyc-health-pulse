// ─── Owner-editable venue policy ─────────────────────────────────────────────
// The tables live in src/data/venue-policy.json (plain data, easy to edit —
// add a brand, redeploy). This module is just the matching logic.
//
// Round 5 (July 5 audit): Mango Mango — a dessert chain licensed under DOHMH
// cuisine "Fruits/Vegetables" — ranked in the LIC top results with zero picks.
// DOHMH cuisine can't be trusted for dessert/bubble-tea brands, so they're
// blocked by name. The blocklist gates the route BEFORE brand matching:
// Tiger Sugar and Kung Fu Tea are curated chains (their pages stay), but a
// dessert brand never occupies a ranked pick slot.

import policy from "@/data/venue-policy.json";

const DESSERT_BRANDS: string[] = (policy.dessertBrands ?? []).map((b: string) => b.toUpperCase());
const BAR_ALLOWLIST: string[] = (policy.foodForwardBarAllowlist ?? []).map((b: string) => b.toUpperCase());

/** Dessert/bubble-tea brand — never occupies a ranked pick slot, any meal. */
export function isDessertBrand(rawName: string): boolean {
  if (!rawName) return false;
  const upper = rawName.toUpperCase();
  return DESSERT_BRANDS.some((b) => upper.includes(b));
}

/** Curated allowlist of verified food-forward bars (Woodbines, Gantry…). */
export function isAllowlistedFoodBar(rawName: string): boolean {
  if (!rawName) return false;
  const upper = rawName.toUpperCase();
  return BAR_ALLOWLIST.some((b) => upper.includes(b));
}
