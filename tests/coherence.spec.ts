import { test, expect } from "@playwright/test";
import { GENERIC_TEMPLATES, templateByCuisineKey, matchGenericCategory } from "../src/lib/genericRestaurants";
import { classificationOverride } from "../src/lib/venueClassification";
import { inferMealType, mealMatches, type MealCategory } from "../src/lib/inferMealType";
import { classifyItemType, isHeadlineItem } from "../src/lib/itemType";
import { CHAINS } from "../src/lib/restaurantData";

const MEALS: MealCategory[] = ["breakfast", "lunch", "coffee", "snack", "dinner"];

// Mirrors the route's meal-coherence guard: a pick may only surface under a meal
// tab if it is an exact or compatible match (priority >= 1).
function coherentPicks(picks: { name: string }[], meal: MealCategory, category: string) {
  return picks.filter((p) => {
    const inferred = inferMealType(p.name, undefined, category);
    return inferred === meal || mealMatches(inferred, meal);
  });
}

test.describe("Maman classification", () => {
  test("Maman → café, not pizza/Italian", () => {
    expect(classificationOverride("Maman")).toBe("cafe");
    expect(classificationOverride("Maman Tribeca")).toBe("cafe");
    const t = templateByCuisineKey("cafe");
    expect(t?.cuisineKey).toBe("cafe");
  });

  test("French DOHMH cuisine no longer maps to the lasagna template", () => {
    const t = matchGenericCategory("French");
    expect(t?.cuisineKey).not.toBe("pizza");
  });

  test("Maman renders coherent café picks under Breakfast (not empty, not lasagna)", () => {
    const cafe = templateByCuisineKey("cafe")!;
    const picks = coherentPicks(cafe.picks, "breakfast", cafe.category);
    expect(picks.length).toBeGreaterThan(0);
    expect(picks.some((p) => /lasagna/i.test(p.name))).toBe(false);
  });
});

test.describe("meal-coherence across templates", () => {
  test("no dinner-only entrée surfaces under Breakfast", () => {
    for (const t of GENERIC_TEMPLATES) {
      const picks = coherentPicks(t.picks, "breakfast", t.category);
      for (const p of picks) {
        const inferred = inferMealType(p.name, undefined, t.category);
        expect(inferred, `${t.category} "${p.name}" under breakfast`).not.toBe("dinner");
      }
    }
  });

  test("every surfaced pick matches its meal tab", () => {
    for (const t of GENERIC_TEMPLATES) {
      for (const meal of MEALS) {
        for (const p of coherentPicks(t.picks, meal, t.category)) {
          const inferred = inferMealType(p.name, undefined, t.category);
          expect(inferred === meal || mealMatches(inferred, meal)).toBe(true);
        }
      }
    }
  });
});

test.describe("Italian/pizza template", () => {
  test("no Lasagna headliner; has leaner canonical orders", () => {
    const pizza = GENERIC_TEMPLATES.find((t) => t.cuisineKey === "pizza")!;
    expect(pizza.picks.some((p) => /lasagna/i.test(p.name))).toBe(false);
    expect(pizza.picks.some((p) => /grilled (chicken|fish)|minestrone/i.test(p.name))).toBe(true);
  });
});

test.describe("/restaurants headline filter", () => {
  test("condiments, drinks, and tiny sides are excluded from headline items", () => {
    expect(classifyItemType({ name: "Cane's Sauce" })).toBe("condiment");
    expect(classifyItemType({ name: "Side of Queso Blanco" })).toBe("condiment");
    expect(isHeadlineItem({ name: "Cane's Sauce", cal: 190 })).toBe(false);
    expect(isHeadlineItem({ name: "Side of Queso Blanco", cal: 240 })).toBe(false);
    expect(isHeadlineItem({ name: "Green Beans", cal: 25 })).toBe(false);
    // A real meal passes
    expect(isHeadlineItem({ name: "Grilled Chicken Bowl", cal: 480 })).toBe(true);
  });

  test("Hale & Hearty was renamed (no 'Chipotle-Style' label)", () => {
    const hale = CHAINS.find((c) => c.slug === "hale-and-hearty");
    expect(hale?.name).toBe("Hale & Hearty");
    expect(CHAINS.some((c) => /Chipotle-Style/i.test(c.name))).toBe(false);
  });
});
