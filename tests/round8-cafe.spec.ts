import { test, expect } from "@playwright/test";
import { templateByCuisineKey, matchGenericCategory, GENERIC_TEMPLATES } from "../src/lib/genericRestaurants";
import { inferMealType, mealMatches } from "../src/lib/inferMealType";
import { confirmsCafeFoodService } from "../src/lib/refinedCategory";

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

test.describe("café food-service gate (July 14 closeout)", () => {
  test("Madame Sousou class (camis 50012082): cafe-typed French café → lunch picks", () => {
    // Google types real French cafés `cafe` without `restaurant` — the
    // round-8 restaurant-only gate missed them.
    expect(confirmsCafeFoodService(["cafe", "coffee_shop", "food", "point_of_interest"])).toBe(true);
    expect(confirmsCafeFoodService(["french_restaurant", "cafe"])).toBe(true);
    expect(confirmsCafeFoodService(["restaurant"])).toBe(true);
  });

  test("Blended Smoothies / Didi's class: juice-typed shops stay guidance-only", () => {
    expect(confirmsCafeFoodService(["juice_shop", "cafe"])).toBe(false);
    expect(confirmsCafeFoodService(["smoothie_shop"])).toBe(false);
  });

  test("coffee-only and dessert shops stay guidance-only", () => {
    expect(confirmsCafeFoodService(["coffee_shop"])).toBe(false);
    expect(confirmsCafeFoodService(["dessert_shop", "cafe"])).toBe(false);
    expect(confirmsCafeFoodService([])).toBe(false);
    expect(confirmsCafeFoodService(null)).toBe(false);
  });
});

test("template registry still has unique cuisineKeys", () => {
  const keys = GENERIC_TEMPLATES.map((t) => t.cuisineKey);
  expect(new Set(keys).size).toBe(keys.length);
});
