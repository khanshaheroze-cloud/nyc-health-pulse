// ─── Refined venue categories from Google Places types (Round 7 phase 4) ────
// Places `types` beat DOHMH cuisine strings for WHAT a venue is (DOHMH
// licenses Mango Mango as "Fruits/Vegetables"; Places says dessert shop).
// Precedence everywhere (Round 8 phase 1): owner override
// (venueClassification.ts) → brand-matched chain category → Places type →
// DOHMH cuisine heuristic (null = no change). A brand match is ground truth
// for WHAT a venue is — the Queens Blvd Starbucks whose Google types include
// convenience_store is still a coffee shop, never a "Deli / Bodega".
// Pure module — client-safe.

export type RefinedCategory =
  | "restaurant"
  | "cafe"
  | "bakery"
  | "bar"
  | "fast_food"
  | "deli_bodega"
  | "juice_smoothie"
  | "dessert";

/** Card chip label + icon per refined category (one consistent set). */
export const CATEGORY_META: Record<RefinedCategory, { label: string; icon: string }> = {
  restaurant: { label: "Restaurant", icon: "🍽️" },
  cafe: { label: "Café", icon: "☕" },
  bakery: { label: "Bakery", icon: "🥐" },
  bar: { label: "Bar", icon: "🍸" },
  fast_food: { label: "Fast Food", icon: "🍔" },
  deli_bodega: { label: "Deli / Bodega", icon: "🥪" },
  juice_smoothie: { label: "Juice & Smoothies", icon: "🥤" },
  dessert: { label: "Dessert", icon: "🍦" },
};

// Places API (New) type → refined category, most-specific first. A venue
// typed ["bar","restaurant"] is a restaurant that serves drinks; only
// bar-typed-without-food venues classify as bar.
const DESSERT_TYPES = new Set(["dessert_shop", "dessert_restaurant", "ice_cream_shop", "frozen_yogurt_shop", "candy_store", "chocolate_shop", "chocolate_factory", "acai_shop"]);
const JUICE_TYPES = new Set(["juice_shop", "smoothie_shop"]);
const BAKERY_TYPES = new Set(["bakery", "bagel_shop", "donut_shop"]);
const DELI_TYPES = new Set(["deli", "convenience_store", "grocery_store", "food_store", "market"]);
const FAST_FOOD_TYPES = new Set(["fast_food_restaurant", "meal_takeaway"]);
const CAFE_TYPES = new Set(["cafe", "coffee_shop", "tea_house", "cat_cafe", "dog_cafe", "internet_cafe"]);
const BAR_TYPES = new Set(["bar", "pub", "wine_bar", "night_club", "karaoke"]);

export function categoryFromPlacesTypes(types: string[] | null | undefined): RefinedCategory | null {
  if (!types || types.length === 0) return null;
  const has = (set: Set<string>) => types.some((t) => set.has(t));
  const hasRestaurant = types.includes("restaurant") || types.some((t) => t.endsWith("_restaurant") && !FAST_FOOD_TYPES.has(t) && !DESSERT_TYPES.has(t));

  if (has(DESSERT_TYPES)) return "dessert";
  if (has(JUICE_TYPES)) return "juice_smoothie";
  if (has(BAKERY_TYPES)) return "bakery";
  if (has(DELI_TYPES)) return "deli_bodega";
  if (has(FAST_FOOD_TYPES)) return "fast_food";
  if (has(CAFE_TYPES)) return "cafe";
  if (has(BAR_TYPES) && !hasRestaurant) return "bar";
  if (hasRestaurant || types.includes("meal_delivery")) return "restaurant";
  return null;
}

// DOHMH cuisine heuristic — only the descriptors that state a refined
// category unambiguously; everything else returns null = keep current chip.
const DOHMH_REFINED: Record<string, RefinedCategory> = {
  "café/coffee/tea": "cafe",
  "cafe/coffee/tea": "cafe",
  "coffee/tea": "cafe",
  "juice, smoothies, fruit salads": "juice_smoothie",
  "bakery products/desserts": "bakery",
  "donuts": "bakery",
  "bagels/pretzels": "bakery",
  "frozen desserts": "dessert",
  "ice cream, gelato, yogurt, ices": "dessert",
  "delicatessen": "deli_bodega",
};

export function categoryFromDohmhCuisine(cuisineDescription: string | null | undefined): RefinedCategory | null {
  if (!cuisineDescription) return null;
  return DOHMH_REFINED[cuisineDescription.toLowerCase().trim()] ?? null;
}

// ── Brand-matched chains (Round 8 phase 1) ───────────────────────────────────
// A chain's curated menu category IS its refined category; Places types never
// re-type a brand match (a Starbucks co-located with a convenience counter is
// still a coffee shop). The chain card's chip renders the brand category
// verbatim ("Coffee & Bakery"); this mapping only feeds category logic.
const CHAIN_CATEGORY_REFINED: Record<string, RefinedCategory> = {
  "Coffee & Bakery": "cafe",
  Coffee: "cafe",
  "Fast Food": "fast_food",
  Burger: "fast_food",
  Chicken: "fast_food",
  Pizza: "fast_food",
  Sandwich: "fast_food",
  "Fast Casual": "restaurant",
  Healthy: "restaurant",
  Asian: "restaurant",
  Mexican: "restaurant",
  Seafood: "restaurant",
  "Middle Eastern": "restaurant",
  Diner: "restaurant",
  Breakfast: "restaurant",
};

/** Refined category for a brand-matched chain from its curated menu category. */
export function chainRefinedCategory(chainCategory: string): RefinedCategory {
  return CHAIN_CATEGORY_REFINED[chainCategory] ?? "restaurant";
}

// ── Template coherence for non-chain venues (Round 8 phase 1) ────────────────
// When Places type and DOHMH cuisine disagree (Fresco Deli Cafe: Places says
// bakery, the assigned template is Sandwich Shop), the chip must agree with
// the picks — a card whose picks are subs must not be chipped "Bakery".
// Allowed refined categories per generic-template cuisineKey; a Places type
// outside the set is dropped and the chip falls back to the template label.
const TEMPLATE_COMPATIBLE: Record<string, RefinedCategory[]> = {
  bodega: ["deli_bodega"],
  deli: ["deli_bodega", "cafe"],
  halal: ["restaurant", "fast_food"],
  bagels: ["bakery", "cafe", "deli_bodega"],
  cafe: ["cafe", "bakery"],
  sandwiches: ["deli_bodega", "fast_food", "restaurant", "cafe"],
  pizza: ["restaurant", "fast_food"],
  diner: ["restaurant", "cafe"],
};
const TEMPLATE_COMPATIBLE_DEFAULT: RefinedCategory[] = ["restaurant", "fast_food"];

/** Reconcile a Places-derived category with the venue's assigned template.
 *  - dessert/bar always pass through: they are ranked-eligibility signals
 *    (the venue is gated out of ranked, so no contradicting chip ever shows).
 *  - A template-compatible Places category wins (it's the fresher source).
 *  - Otherwise keep the compatible baseline (owner/DOHMH), else null — the
 *    chip falls back to the template's own category label. */
export function reconcileGenericCategory(
  placesCat: RefinedCategory,
  templateKey: string,
  baseline: RefinedCategory | null,
): RefinedCategory | null {
  if (placesCat === "dessert" || placesCat === "bar") return placesCat;
  const allowed = TEMPLATE_COMPATIBLE[templateKey] ?? TEMPLATE_COMPATIBLE_DEFAULT;
  if (allowed.includes(placesCat)) return placesCat;
  if (baseline && allowed.includes(baseline)) return baseline;
  return null;
}
