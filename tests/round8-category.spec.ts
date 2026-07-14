import { test, expect } from "@playwright/test";
import {
  categoryFromPlacesTypes,
  categoryFromDohmhCuisine,
  chainRefinedCategory,
  reconcileGenericCategory,
} from "../src/lib/refinedCategory";

// Round 8 phase 1 — category precedence, by the July 13 live-validation cases.
// Precedence: owner override → brand-matched chain category → Places type →
// DOHMH cuisine heuristic. Pure logic, no network.

test.describe("brand-matched chains keep their brand category", () => {
  // The Queens Blvd Starbucks: Google types that location with
  // convenience_store, which the Places mapping reads as deli_bodega. A brand
  // match must never be re-typed by Places — the route only consults Places
  // types for GENERIC venues; chains get chainRefinedCategory at push time.
  test("Starbucks (Queens Blvd class): convenience-typed Places result is the leak the brand chip fixes", () => {
    // What Places says about that location — the value that leaked in Round 7:
    expect(categoryFromPlacesTypes(["convenience_store", "cafe", "coffee_shop"])).toBe("deli_bodega");
    // Brand precedence: the chip comes from the curated chain category.
    expect(chainRefinedCategory("Coffee & Bakery")).toBe("cafe");
  });

  test("every curated chain category maps to a sane refined category", () => {
    expect(chainRefinedCategory("Fast Food")).toBe("fast_food");
    expect(chainRefinedCategory("Healthy")).toBe("restaurant");
    expect(chainRefinedCategory("Diner")).toBe("restaurant");
    // Unknown/future category never crashes — defaults to restaurant.
    expect(chainRefinedCategory("Some New Category")).toBe("restaurant");
  });
});

test.describe("template coherence for non-chain venues", () => {
  // Fresco Deli Cafe: DOHMH "Sandwiches" → sandwiches template (picks are
  // subs), but Places types it bakery. A card whose picks are subs must not
  // be chipped "Bakery" → the Places type is dropped and the chip falls back
  // to the template's own label ("Sandwich Shop").
  test("Fresco class: Places 'bakery' on a sandwiches-template venue → dropped (null)", () => {
    expect(categoryFromDohmhCuisine("Sandwiches")).toBeNull(); // baseline is null
    expect(reconcileGenericCategory("bakery", "sandwiches", null)).toBeNull();
  });

  test("agreement case: Places 'cafe' on a cafe-template venue → cafe", () => {
    expect(reconcileGenericCategory("cafe", "cafe", null)).toBe("cafe");
  });

  test("compatible upgrade: Places 'deli_bodega' on a sandwiches template is coherent", () => {
    expect(reconcileGenericCategory("deli_bodega", "sandwiches", null)).toBe("deli_bodega");
  });

  test("incompatible Places type keeps a compatible baseline", () => {
    // DOHMH said delicatessen (deli_bodega), Places says bakery, template is
    // deli → keep the baseline rather than contradicting the picks.
    expect(reconcileGenericCategory("bakery", "deli", "deli_bodega")).toBe("deli_bodega");
  });

  test("dessert/bar always pass through — they are ranked-eligibility signals", () => {
    // A dessert-typed venue on any template must still be gated from ranked
    // (the Mango Mango protection) — reconcile never suppresses it.
    expect(reconcileGenericCategory("dessert", "diner", null)).toBe("dessert");
    expect(reconcileGenericCategory("bar", "mexican", "restaurant")).toBe("bar");
  });

  test("unknown template key uses the restaurant/fast_food default set", () => {
    expect(reconcileGenericCategory("fast_food", "peruvian", null)).toBe("fast_food");
    expect(reconcileGenericCategory("juice_smoothie", "peruvian", null)).toBeNull();
  });
});
