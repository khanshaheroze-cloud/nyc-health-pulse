import { test, expect } from "@playwright/test";
import { classifyBar, barChipLabel } from "../src/lib/venuePolicy";
import { healthyPickEligibility } from "../src/lib/venue-normalize";

// Round 5 P1 — bar policy (owner directive): drink-first dive bars OUT of
// ranked picks; established food-forward bars (gastropubs with real kitchens)
// STAY. Woodbines was ranked by luck (cuisine "Irish"); now it's policy.

test.describe("classifyBar", () => {
  test("Woodbines → food-forward (allowlist), chip 'Gastropub'", () => {
    expect(classifyBar("WOODBINES", "Irish")).toBe("food-forward-bar");
    expect(barChipLabel("WOODBINES")).toBe("Gastropub");
  });

  test("GANTRY BAR & KITCHEN → food-forward, chip 'Bar & Kitchen'", () => {
    expect(classifyBar("GANTRY BAR & KITCHEN", "American")).toBe("food-forward-bar");
    expect(barChipLabel("GANTRY BAR & KITCHEN")).toBe("Bar & Kitchen");
  });

  test("non-allowlisted bar earns food-forward via KITCHEN token + food cuisine", () => {
    expect(classifyBar("HUNTERS POINT BAR & KITCHEN", "American")).toBe("food-forward-bar");
    expect(classifyBar("VERNON GRILL & TAP ROOM", "American")).toBe("food-forward-bar");
  });

  test("McSorley's-style ale house → drink-first (no food signal in name)", () => {
    expect(classifyBar("MCSORLEY'S OLD ALE HOUSE", "Irish")).toBe("drink-first-bar");
    expect(classifyBar("THE LOCAL TAVERN", "American")).toBe("drink-first-bar");
    expect(classifyBar("LIC BEER GARDEN", "American")).toBe("drink-first-bar");
  });

  test("cuisine Bottled Beverages/Alcohol → drink-first regardless of name", () => {
    expect(classifyBar("CORNER SPOT", "Bottled Beverages")).toBe("drink-first-bar");
    expect(classifyBar("VERNON KITCHEN", "Alcohol")).toBe("drink-first-bar");
  });

  test("bar signal + food name but drinks-only cuisine → drink-first", () => {
    expect(classifyBar("DIVE BAR & GRILL", "Bottled Beverages")).toBe("drink-first-bar");
  });

  test("healthy 'bar' types and plain restaurants are not bars", () => {
    expect(classifyBar("JUICE BAR NYC", "Juice, Smoothies, Fruit Salads")).toBe("not-a-bar");
    expect(classifyBar("SALAD BAR EXPRESS", "Salads")).toBe("not-a-bar");
    expect(classifyBar("TAMASHII RAMEN", "Japanese")).toBe("not-a-bar");
    expect(classifyBar("BARROW STREET CAFE", "Café/Coffee/Tea")).toBe("not-a-bar");
  });
});

test.describe("healthyPickEligibility — bar integration", () => {
  test("Woodbines is eligible for ranked picks", () => {
    expect(healthyPickEligibility("WOODBINES", "Irish", false).eligible).toBe(true);
  });

  test("drink-first bars are excluded with a logged reason", () => {
    const r = healthyPickEligibility("MCSORLEY'S OLD ALE HOUSE", "Irish", false);
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe("drink-first bar");
    expect(healthyPickEligibility("CORNER SPOT", "Bottled Beverages", false).eligible).toBe(false);
  });

  test("food-forward bar with a tavern token is not killed by nightlife patterns", () => {
    expect(healthyPickEligibility("GREENPOINT TAVERN KITCHEN", "American", false).eligible).toBe(true);
  });
});

// ── Live API: Woodbines ranks with an honest chip (LIC audit coords) ─────────
test("Woodbines appears in LIC dinner results as a Gastropub", async ({ request }) => {
  const res = await request.get(`/api/smart-menu/near-me?lat=40.74523&lng=-73.953506&meal=dinner`, { timeout: 60_000 });
  const data = (await res.json()) as {
    restaurants: { restaurantName: string; category: string; cuisine: string; topPicks: unknown[] }[];
  };
  const woodbines = data.restaurants.find((r) => /woodbines/i.test(r.restaurantName));
  expect(woodbines, "Woodbines missing from LIC dinner results").toBeTruthy();
  expect(woodbines!.category).toBe("Gastropub");
  expect(woodbines!.topPicks.length).toBeGreaterThan(0);
});
