/* Result sectioning — the web's round-4/5/6 semantics must hold in the app.
 * Fixtures mirror the recorded live contract shapes (lib/types.ts). */
import { sectionResults, isUnder15, wedgeScore, orderPriceLabel } from "../lib/results";
import { dedupeByRestaurantId } from "../lib/api";
import type { ApiRestaurant } from "../lib/types";

function venue(over: Partial<ApiRestaurant>): ApiRestaurant {
  return {
    restaurantId: `id-${Math.random().toString(36).slice(2)}`,
    slug: "generic-deli",
    restaurantName: "Test Venue",
    cuisine: "Deli",
    priceRange: 1,
    priceTier: "$",
    distance: 100,
    walkMinutes: 2,
    lat: 40.744,
    lng: -73.949,
    address: "1 Test St",
    grade: "A",
    inspectedAt: "2026-06-01T00:00:00.000",
    isGeneric: true,
    category: "Deli",
    topPicks: [
      {
        id: "p1",
        name: "Turkey Sandwich",
        calories: 400,
        protein: 28,
        carbs: 0,
        fat: 0,
        fiber: 0,
        pulseScore: 70,
        estPrice: 9,
      },
    ],
    bestDrink: null,
    locationCount: 1,
    otherLocations: [],
    camis: "123",
    openState: "open",
    hoursSource: "google",
    hoursChip: { label: "Open now", tone: "open" },
    ...over,
  };
}

describe("sectionResults", () => {
  test("dedupes by restaurantId — duplicate rows render once (round-6 class)", () => {
    const dup = venue({ restaurantId: "starbucks-40.74", restaurantName: "Starbucks" });
    const { ranked } = sectionResults([dup, { ...dup }, { ...dup }]);
    expect(ranked).toHaveLength(1);
  });

  test("known-closed and liveness-labeled venues never rank", () => {
    const open = venue({ restaurantId: "a" });
    const closed = venue({ restaurantId: "b", openState: "closed" });
    const gated = venue({ restaurantId: "c", livenessLabel: "Permanently closed — report if wrong" });
    const { ranked } = sectionResults([open, closed, gated]);
    expect(ranked.map((r) => r.restaurantId)).toEqual(["a"]);
  });

  test("under-$15 in ranked, over-$15 in splurge, pickless in guidance", () => {
    const cheap = venue({ restaurantId: "cheap" });
    const splurgey = venue({
      restaurantId: "splurge",
      priceRange: 3,
      priceTier: "$$$",
      topPicks: [{ ...cheap.topPicks[0], estPrice: 24, pulseScore: 90 }],
    });
    const guidance = venue({ restaurantId: "guide", topPicks: [], orderingTip: "Ask for it on wheat." });
    const s = sectionResults([cheap, splurgey, guidance]);
    expect(s.ranked.map((r) => r.restaurantId)).toEqual(["cheap"]);
    expect(s.splurge.map((r) => r.restaurantId)).toEqual(["splurge"]);
    expect(s.guidance.map((r) => r.restaurantId)).toEqual(["guide"]);
  });

  test("ranked caps at five", () => {
    const many = Array.from({ length: 9 }, (_, i) => venue({ restaurantId: `v${i}` }));
    expect(sectionResults(many).ranked).toHaveLength(5);
  });

  test("sort/filter is idempotent — re-sorting never accumulates or reorders equal inputs", () => {
    const list = [
      venue({ restaurantId: "a", walkMinutes: 1, topPicks: [{ ...venue({}).topPicks[0], pulseScore: 60, protein: 40 }] }),
      venue({ restaurantId: "b", walkMinutes: 9, topPicks: [{ ...venue({}).topPicks[0], pulseScore: 90, protein: 10 }] }),
      venue({ restaurantId: "c", walkMinutes: 4 }),
    ];
    const once = sectionResults(list, { sort: "protein" });
    const twice = sectionResults(list, { sort: "protein" });
    expect(twice.ranked.map((r) => r.restaurantId)).toEqual(once.ranked.map((r) => r.restaurantId));

    // Owner repro: churn through sorts and back — same result, same length.
    sectionResults(list, { sort: "distance" });
    sectionResults(list, { sort: "calories" });
    const back = sectionResults(list, { sort: "protein" });
    expect(back.ranked.map((r) => r.restaurantId)).toEqual(once.ranked.map((r) => r.restaurantId));
    expect(back.ranked.length + back.splurge.length + back.guidance.length).toBeLessThanOrEqual(list.length);
  });

  test("filters subset: open-now keeps only KNOWN-open (never unknown)", () => {
    const open = venue({ restaurantId: "open" });
    const unknown = venue({ restaurantId: "unknown", openState: "unknown", hoursChip: { label: "Hours unknown", tone: "unknown" } });
    const s = sectionResults([open, unknown], { chips: new Set(["open-now"]) });
    expect(s.ranked.map((r) => r.restaurantId)).toEqual(["open"]);
  });

  test("quick filter: walk ≤ 5", () => {
    const near = venue({ restaurantId: "near", walkMinutes: 3 });
    const far = venue({ restaurantId: "far", walkMinutes: 8 });
    const s = sectionResults([near, far], { chips: new Set(["quick"]) });
    expect(s.ranked.map((r) => r.restaurantId)).toEqual(["near"]);
  });
});

describe("pricing semantics", () => {
  test("isUnder15: exact price wins; unknown falls back to price band", () => {
    expect(isUnder15(venue({ topPicks: [{ ...venue({}).topPicks[0], estPrice: 15 }] }))).toBe(true);
    expect(isUnder15(venue({ topPicks: [{ ...venue({}).topPicks[0], estPrice: 16 }] }))).toBe(false);
    expect(isUnder15(venue({ priceRange: 2, topPicks: [{ ...venue({}).topPicks[0], estPrice: null }] }))).toBe(true);
    expect(isUnder15(venue({ priceRange: 3, topPicks: [{ ...venue({}).topPicks[0], estPrice: null }] }))).toBe(false);
  });

  test("orderPriceLabel: exact when known, honest band when not", () => {
    expect(orderPriceLabel(venue({}))).toBe("~$9");
    expect(orderPriceLabel(venue({ priceRange: 2, topPicks: [{ ...venue({}).topPicks[0], estPrice: null }] }))).toBe("~$10–15");
  });

  test("wedgeScore: +8 under-15 anchor, −8 for $$$, +2 verified", () => {
    const base = venue({});
    expect(wedgeScore(base)).toBe(70 + 8);
    expect(wedgeScore(venue({ verifiedBadge: "verified" }))).toBe(70 + 8 + 2);
    expect(
      wedgeScore(venue({ priceRange: 3, topPicks: [{ ...base.topPicks[0], estPrice: 20 }] })),
    ).toBe(70 - 8);
  });
});

describe("dedupeByRestaurantId (API guard)", () => {
  test("drops duplicates and id-less rows", () => {
    const a = venue({ restaurantId: "a" });
    const rows = [a, { ...a }, { ...a, restaurantId: "" } as ApiRestaurant];
    expect(dedupeByRestaurantId(rows)).toHaveLength(1);
  });
});
