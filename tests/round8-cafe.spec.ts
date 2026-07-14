import { test, expect } from "@playwright/test";
import { templateByCuisineKey, matchGenericCategory, GENERIC_TEMPLATES } from "../src/lib/genericRestaurants";
import { inferMealType, mealMatches } from "../src/lib/inferMealType";

// Round 8 phase 3 — light-lunch café template (Cafe Henri / Tournesol class).
// Applied only after Places confirms food service; never reachable from a
// DOHMH cuisine string alone.

test("cafe-food template exists with lunch-coherent picks under $15", () => {
  const t = templateByCuisineKey("cafe-food");
  expect(t).not.toBeNull();
  const lunchPicks = t!.picks.filter((p) => mealMatches(inferMealType(p.name, undefined, t!.category), "lunch"));
  expect(lunchPicks.length).toBeGreaterThanOrEqual(2); // soup+half sandwich, Niçoise
  for (const p of t!.picks) expect(p.estimatedPrice ?? 0).toBeLessThanOrEqual(15);
});

test("no DOHMH cuisine string maps to cafe-food (Places confirmation is the only path in)", () => {
  // The template must be unreachable from matchGenericCategory — a coffee-only
  // shop licensed "Café/Coffee/Tea" or "French" keeps the drinks template.
  expect(matchGenericCategory("Café/Coffee/Tea")?.cuisineKey).toBe("cafe");
  expect(matchGenericCategory("French")?.cuisineKey).toBe("cafe");
  for (const cuisine of ["Café/Coffee/Tea", "French", "American", "Delicatessen", "Sandwiches"]) {
    expect(matchGenericCategory(cuisine)?.cuisineKey).not.toBe("cafe-food");
  }
});

test("template registry still has unique cuisineKeys", () => {
  const keys = GENERIC_TEMPLATES.map((t) => t.cuisineKey);
  expect(new Set(keys).size).toBe(keys.length);
});
