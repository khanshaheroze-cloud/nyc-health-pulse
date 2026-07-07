import { test, expect } from "@playwright/test";
import {
  classifyMatch,
  nameSimilarity,
  tokenOverlap,
  newPlacesPeriodsToWeekly,
  type PlaceLite,
  type PlacesEnrichment,
} from "../src/lib/places";
import { computeLiveness } from "../src/lib/liveness";
import { categoryFromPlacesTypes, categoryFromDohmhCuisine } from "../src/lib/refinedCategory";

// Round 7 — the liveness/geometry/category layer, by the owner's three named
// field cases (July 6 audit) plus the gate branches. Pure logic, no network.

function place(over: Partial<PlaceLite>): PlaceLite {
  return {
    placeId: "p",
    displayName: "",
    businessStatus: "OPERATIONAL",
    types: [],
    lat: 0,
    lng: 0,
    formattedAddress: "",
    weeklyHours: null,
    rating: null,
    userRatingCount: null,
    ...over,
  };
}

test.describe("classifyMatch — the owner's named cases", () => {
  // Yards Bar & Grill: DOHMH camis at 26-32 Skillman Ave, no venue on the
  // ground anymore → no Places match at all.
  test("Yards Bar & Grill: no similar Places candidate → unmatched", () => {
    const e = classifyMatch(
      { name: "Yards Bar & Grill", lat: 40.7440, lng: -73.9450 },
      [place({ displayName: "Skillman Deli & Grocery", lat: 40.7441, lng: -73.9451 })],
    );
    expect(e.status).toBe("unmatched");
    expect(e.place).toBeNull();
  });

  // Maman: the DOHMH record sits at 47-16 Austell Pl (a commissary/production
  // kitchen). The only Places name-match is the real Petite Maman café ~600m
  // away → a confident NAME match beyond the 150m distance gate.
  test("Maman: name matches Petite Maman but beyond 150m → address-mismatch", () => {
    const e = classifyMatch(
      { name: "Maman", lat: 40.7418, lng: -73.9370 }, // Austell Pl commissary
      [place({ displayName: "Petite Maman", lat: 40.7445, lng: -73.9430, formattedAddress: "31-00 47th Ave" })],
    );
    expect(e.status).toBe("address-mismatch");
    expect(e.distanceM ?? 0).toBeGreaterThan(150);
    expect(e.matchConfidence ?? 0).toBeGreaterThan(0.6);
  });

  test("confident name match within 150m → matched", () => {
    const e = classifyMatch(
      { name: "Court Square Diner", lat: 40.7471, lng: -73.9445 },
      [place({ displayName: "Court Square Diner", lat: 40.7472, lng: -73.9446 })],
    );
    expect(e.status).toBe("matched");
    expect(e.distanceM ?? 999).toBeLessThanOrEqual(150);
  });
});

test.describe("computeLiveness — every gate branch", () => {
  const NOW = new Date("2026-07-06T23:00:00-04:00");
  const enr = (over: Partial<PlacesEnrichment>): PlacesEnrichment => ({
    status: "unmatched",
    matchConfidence: null,
    distanceM: null,
    place: null,
    fetchedAt: NOW.toISOString(),
    ...over,
  });

  test("null enrichment (layer dark / not attempted) → dohmh-only", () => {
    expect(computeLiveness(null, "2026-06-01", false, NOW)).toBe("dohmh-only");
  });

  test("community-closed overrides everything", () => {
    expect(computeLiveness(null, "2026-06-01", true, NOW)).toBe("community-closed");
  });

  test("Yards class: unmatched + stale (>14mo) inspection → unverified-stale", () => {
    expect(computeLiveness(enr({ status: "unmatched" }), "2025-05-01", false, NOW)).toBe("unverified-stale");
  });

  test("unmatched but recently inspected (≤14mo) → dohmh-only (don't punish new venues)", () => {
    expect(computeLiveness(enr({ status: "unmatched" }), "2026-06-01", false, NOW)).toBe("dohmh-only");
  });

  test("Maman class: address-mismatch stays address-mismatch", () => {
    expect(computeLiveness(enr({ status: "address-mismatch", distanceM: 600 }), "2026-06-01", false, NOW)).toBe("address-mismatch");
  });

  test("matched OPERATIONAL → places-verified", () => {
    expect(computeLiveness(enr({ status: "matched", place: place({ businessStatus: "OPERATIONAL" }) }), "2026-06-01", false, NOW)).toBe("places-verified");
  });

  test("matched CLOSED_PERMANENTLY → closed-permanent", () => {
    expect(computeLiveness(enr({ status: "matched", place: place({ businessStatus: "CLOSED_PERMANENTLY" }) }), "2026-06-01", false, NOW)).toBe("closed-permanent");
  });

  test("matched CLOSED_TEMPORARILY → closed-temporary", () => {
    expect(computeLiveness(enr({ status: "matched", place: place({ businessStatus: "CLOSED_TEMPORARILY" }) }), "2026-06-01", false, NOW)).toBe("closed-temporary");
  });
});

test.describe("name similarity", () => {
  test("Maman ⊂ Petite Maman → full token overlap", () => {
    expect(tokenOverlap("Maman", "Petite Maman")).toBe(1);
    expect(nameSimilarity("Maman", "Petite Maman")).toBeGreaterThanOrEqual(0.62);
  });

  test("unrelated names score low", () => {
    expect(nameSimilarity("Yards Bar & Grill", "Skillman Deli")).toBeLessThan(0.62);
  });
});

test.describe("refined category from Places types (beats DOHMH cuisine)", () => {
  const cases: [string[], string][] = [
    [["dessert_shop"], "dessert"], // Mango Mango's "Fruits/Vegetables" problem
    [["ice_cream_shop"], "dessert"],
    [["convenience_store"], "deli_bodega"],
    [["deli", "grocery_store"], "deli_bodega"],
    [["bakery"], "bakery"],
    [["cafe", "coffee_shop"], "cafe"],
    [["juice_shop"], "juice_smoothie"],
    [["meal_takeaway"], "fast_food"],
    [["bar"], "bar"],
    [["bar", "restaurant"], "restaurant"], // serves drinks but is a restaurant
    [["restaurant"], "restaurant"],
  ];
  for (const [types, expected] of cases) {
    test(`[${types.join(",")}] → ${expected}`, () => {
      expect(categoryFromPlacesTypes(types)).toBe(expected);
    });
  }

  test("empty / null types → null (keep current chip)", () => {
    expect(categoryFromPlacesTypes([])).toBeNull();
    expect(categoryFromPlacesTypes(null)).toBeNull();
  });

  test("DOHMH heuristic still classifies delicatessen → deli_bodega", () => {
    expect(categoryFromDohmhCuisine("Delicatessen")).toBe("deli_bodega");
  });
});

test.describe("Places hours → WeeklyHours", () => {
  test("24/7 (one open period, no close) → every day fully open", () => {
    const w = newPlacesPeriodsToWeekly([{ open: { day: 0, hour: 0, minute: 0 } }]);
    expect(w).not.toBeNull();
    expect(w!).toHaveLength(7);
    for (const day of w!) expect(day).toEqual([{ open: 0, close: 1440 }]);
  });

  test("a normal Mon 9:00–17:00 period lands on day index 1", () => {
    const w = newPlacesPeriodsToWeekly([
      { open: { day: 1, hour: 9, minute: 0 }, close: { day: 1, hour: 17, minute: 0 } },
    ]);
    expect(w![1]).toEqual([{ open: 540, close: 1020 }]);
    expect(w![2]).toEqual([]);
  });

  test("empty periods → null (unknown, never assumed open)", () => {
    expect(newPlacesPeriodsToWeekly([])).toBeNull();
    expect(newPlacesPeriodsToWeekly(undefined)).toBeNull();
  });
});
