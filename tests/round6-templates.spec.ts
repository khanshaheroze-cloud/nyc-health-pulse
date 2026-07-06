import { test, expect } from "@playwright/test";
import { matchGenericCategory, templateByCuisineKey, GENERIC_TEMPLATES } from "../src/lib/genericRestaurants";
import { classificationOverride } from "../src/lib/venueClassification";

// Round 6 P1 — template mapping refinements from live results:
// bagel shops were Diners with grilled-chicken picks; "The Inkan" (Peruvian)
// served taco picks; the whole Latin family borrowed the Mexican template.

test.describe("bagel template", () => {
  test("BAGEL in the DBA routes to the bagel template (Pumpernickel Bagel)", () => {
    expect(classificationOverride("Pumpernickel Bagel")).toBe("bagels");
    expect(classificationOverride("UTOPIA BAGELS")).toBe("bagels");
    expect(templateByCuisineKey("bagels")?.category).toBe("Bagel Shop");
  });

  test("DOHMH Bagels/Pretzels cuisine maps to the bagel template", () => {
    expect(matchGenericCategory("Bagels/Pretzels")?.cuisineKey).toBe("bagels");
  });

  test("bagel picks are bagel-shop food, not diner grilled chicken plates", () => {
    const t = templateByCuisineKey("bagels")!;
    expect(t.picks.some((p) => /bagel/i.test(p.name))).toBe(true);
    expect(t.picks.some((p) => /lox/i.test(p.name))).toBe(true);
    expect(t.picks.every((p) => (p.estimatedPrice ?? 0) <= 15)).toBe(true);
  });
});

test.describe("Peruvian + Latin family — no more borrowed tacos", () => {
  test("Peruvian gets pollo a la brasa, never tacos (The Inkan)", () => {
    const t = matchGenericCategory("Peruvian");
    expect(t?.cuisineKey).toBe("peruvian");
    expect(t!.picks.some((p) => /pollo a la brasa/i.test(p.name))).toBe(true);
    expect(t!.picks.every((p) => !/taco|burrito/i.test(p.name))).toBe(true);
  });

  test("Caribbean/South-American cuisines get pan-Latin plates, not tacos", () => {
    for (const cuisine of ["Caribbean", "Cuban", "Dominican", "Puerto Rican", "Colombian", "Venezuelan", "Spanish", "Latin American", "Latin (Cuban, Dominican, Puerto Rican, South & Central American)"]) {
      const t = matchGenericCategory(cuisine);
      expect(t?.cuisineKey, `${cuisine} should map to latin`).toBe("latin");
      expect(t!.picks.every((p) => !/taco|burrito/i.test(p.name)), `${cuisine} still serves tacos`).toBe(true);
    }
  });

  test("only actual Mexican/Tex-Mex cuisines keep the taco template", () => {
    expect(matchGenericCategory("Mexican")?.cuisineKey).toBe("mexican");
    expect(matchGenericCategory("Tex-Mex")?.cuisineKey).toBe("mexican");
  });

  test("new templates keep the under-$15 promise", () => {
    for (const key of ["peruvian", "latin", "bagels"]) {
      const t = GENERIC_TEMPLATES.find((x) => x.cuisineKey === key)!;
      expect(t.picks.every((p) => p.estimatedPrice == null || p.estimatedPrice <= 15), key).toBe(true);
    }
  });
});
