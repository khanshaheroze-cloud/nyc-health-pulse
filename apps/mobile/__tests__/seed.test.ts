/* Offline seed loader — nearest cell, distance rescaling, meal fallback.
 * Runs against the REAL bundled seed (captured live responses). */
import { getSeedNearMe, getSeedInfo } from "../lib/bundledRestaurants";

describe("offline seed", () => {
  test("seed is present with 12 cells", () => {
    expect(getSeedInfo().cells).toBe(12);
  });

  test("nearest cell answers, in the frozen contract shape", () => {
    const res = getSeedNearMe(40.7446, -73.9487, "lunch");
    expect(res).not.toBeNull();
    expect(res!.cellLabel).toContain("LIC");
    expect(res!.response.restaurants.length).toBeGreaterThan(0);
    const first = res!.response.restaurants[0];
    expect(typeof first.restaurantId).toBe("string");
    expect(first.hoursChip).toBeDefined();
    // Every ranked venue carries a chip (July 14 closeout guarantee held in
    // the captured data too).
    for (const r of res!.response.restaurants) {
      expect(r.categoryChip ?? r.category).toBeTruthy();
    }
  });

  test("distances rescale to the user's coords, not the cell center", () => {
    const near = getSeedNearMe(40.7446, -73.9487, "lunch")!;
    const far = getSeedNearMe(40.75, -73.96, "lunch")!;
    const id = near.response.restaurants[0].restaurantId;
    const sameVenueFar = far.response.restaurants.find((r) => r.restaurantId === id);
    if (sameVenueFar) {
      expect(sameVenueFar.distance).not.toBe(near.response.restaurants[0].distance);
    }
    for (const r of near.response.restaurants) {
      expect(r.walkMinutes).toBe(Math.round(r.distance / 80));
    }
  });

  test("meal falls back when not captured (coffee → lunch)", () => {
    const res = getSeedNearMe(40.7446, -73.9487, "coffee");
    expect(res).not.toBeNull();
    expect(res!.response.restaurants.length).toBeGreaterThan(0);
  });

  test("a Manhattan-core user gets a Manhattan cell", () => {
    const res = getSeedNearMe(40.758, -73.985, "dinner")!;
    expect(res.cellLabel).toBe("Times Square");
    expect(res.cellDistanceM).toBeLessThan(200);
  });
});
