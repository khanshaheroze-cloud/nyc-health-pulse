// Per-venue cuisine/category overrides for venues the DOHMH cuisine_description
// misclassifies. Keyed by normalized venue name (lowercased, see key()). The
// value is a generic-template cuisineKey (see genericRestaurants.ts) OR "none"
// to force ordering-guidance-only (no template picks).
//
// Seeded from the live audit + the Report-an-error queue. Maman is tagged
// "French" in DOHMH, which used to map to the pizza/Italian template and
// produced "Lasagna" as its healthy pick under Breakfast — a café/bakery should
// get café picks.

import type { RefinedCategory } from "@/lib/refinedCategory";

export type ClassificationOverride = string; // a cuisineKey, or "none"

const OVERRIDES: Record<string, ClassificationOverride> = {
  maman: "cafe",
};

// Name-pattern rules — the venue name states its category regardless of the
// DOHMH cuisine string ("Pumpernickel Bagel" was licensed as a Diner and got
// grilled-chicken picks — July 6 audit). Checked after per-venue overrides.
const NAME_PATTERN_RULES: { re: RegExp; key: ClassificationOverride }[] = [
  { re: /\bbagels?\b/i, key: "bagels" },
];

/** Normalize a venue name for override lookup: lowercase, strip store numbers,
 *  punctuation, and common suffixes. */
export function classificationKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/#\s*\d+/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(nyc|llc|inc|corp|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Returns the override cuisineKey for a venue name, or null if none. */
export function classificationOverride(name: string): ClassificationOverride | null {
  const key = classificationKey(name);
  if (OVERRIDES[key]) return OVERRIDES[key];
  // Prefix match so "Maman Tribeca" / "Maman Soho" resolve to the "maman" seed.
  for (const [k, v] of Object.entries(OVERRIDES)) {
    if (key === k || key.startsWith(k + " ")) return v;
  }
  for (const { re, key: cuisineKey } of NAME_PATTERN_RULES) {
    if (re.test(name)) return cuisineKey;
  }
  return null;
}

// ── Refined-category owner overrides (Round 7 phase 4) ──────────────────────
// The refined category (restaurant | cafe | bakery | bar | fast_food |
// deli_bodega | juice_smoothie | dessert) resolves owner override → Places
// type → DOHMH heuristic. This table is the owner override: keyed by
// classificationKey(name), same prefix-match semantics as OVERRIDES above.
// Seeded empty — grows from the Report-an-error queue and audits.
const CATEGORY_OVERRIDES: Record<string, RefinedCategory> = {};

/** Owner-set refined category for a venue name, or null if none. */
export function refinedCategoryOverride(name: string): RefinedCategory | null {
  const key = classificationKey(name);
  if (CATEGORY_OVERRIDES[key]) return CATEGORY_OVERRIDES[key];
  for (const [k, v] of Object.entries(CATEGORY_OVERRIDES)) {
    if (key === k || key.startsWith(k + " ")) return v;
  }
  return null;
}
