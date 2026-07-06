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

// ─── Bar policy (owner directive, July 5) ────────────────────────────────────
// Drink-first dive bars are OUT of ranked picks; big established food-serving
// bars (gastropubs with real kitchens) STAY. Woodbines was ranked by luck —
// its DOHMH cuisine happens to be "Irish" — this makes it policy.

export type BarClass = "not-a-bar" | "food-forward-bar" | "drink-first-bar";

// Dive/drink signals. "bar"/"pub" match as standalone tokens, so "BARROW ST"
// or "PUBLIC KITCHEN" never trip them.
const BAR_SIGNAL_RE =
  /\b(tavern|saloon|ale\s*house|alehouse|taproom|tap\s*room|beer\s*garden|biergarten|brewery|brewing|brewhouse|pub|bar)\b/i;

// Healthy "bar" types are food counters, not drinking bars (juice bar…)
const HEALTHY_BAR_RE = /\b(juice|salad|poke|smoothie|acai|grain|soup|veggie|wellness|ramen|sushi|oyster|raw)\s+bar\b/i;

// A food signal in the NAME: the venue tells you it has a kitchen
const FOOD_NAME_RE = /\b(kitchen|grill|grille|eatery|restaurant|bistro|chophouse|steakhouse|gastropub)\b/i;

// DOHMH cuisines that mean the license is for drinks, not food
const DRINK_CUISINE_RE = /^(bottled beverages|alcohol|beer)$/i;

// Cuisines that are just "we serve drinks/desserts", not a real food kitchen
const NON_FOOD_CUISINE_RE =
  /^(bottled beverages|alcohol|beer|coffee\/tea|not listed\/not applicable|bakery products\/desserts|frozen desserts|donuts)$/i;

/** Classify a venue's bar status from its DOHMH dba + cuisine_description.
 *  - drink-first-bar → excluded from ranked picks, dimmed on the map
 *  - food-forward-bar → ranks normally, chip reads "Gastropub"/"Bar & Kitchen"
 *  - not-a-bar → other policies decide */
export function classifyBar(rawName: string, cuisineDescription: string): BarClass {
  const name = rawName || "";
  if (!name && !cuisineDescription) return "not-a-bar";
  // Curated allowlist wins: verified food-forward bars rank even when their
  // name carries no food token (Woodbines).
  if (isAllowlistedFoodBar(name)) return "food-forward-bar";
  const cuisine = (cuisineDescription || "").trim();
  // A drinks license is a drinks license, whatever the name says.
  if (DRINK_CUISINE_RE.test(cuisine)) return "drink-first-bar";
  if (HEALTHY_BAR_RE.test(name)) return "not-a-bar";
  if (!BAR_SIGNAL_RE.test(name)) return "not-a-bar";
  // Bar-signal venue: it stays only with a real food cuisine AND a kitchen
  // signal in the name (else the allowlist is the path in).
  const hasFoodCuisine = cuisine !== "" && !NON_FOOD_CUISINE_RE.test(cuisine);
  const hasFoodName = FOOD_NAME_RE.test(name);
  return hasFoodCuisine && hasFoodName ? "food-forward-bar" : "drink-first-bar";
}

/** Honest chip label for a ranked food-forward bar — never "Diner". */
export function barChipLabel(rawName: string): string {
  return /\bkitchen\b/i.test(rawName || "") ? "Bar & Kitchen" : "Gastropub";
}
