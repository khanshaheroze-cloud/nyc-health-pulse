import { test, expect } from "@playwright/test";

// Round 4 P0 acceptance: no non-walk-in venue (Fooda, cafeterias, caterers)
// in ranked picks for LIC or Midtown, any meal.

const ORIGINS = [
  { name: "LIC", lat: 40.74523, lng: -73.953506 },
  { name: "Midtown", lat: 40.758, lng: -73.9855 },
];
const MEALS = ["breakfast", "lunch", "dinner", "snack"];
const NON_WALKIN = /\b(fooda|sodexo|aramark|cafeteria|commissary|catering|caterers?)\b/i;

test("ranked picks never contain non-walk-in venues (LIC + Midtown, all meals)", async ({ request }) => {
  test.setTimeout(180_000);
  for (const origin of ORIGINS) {
    for (const meal of MEALS) {
      const res = await request.get(`/api/smart-menu/near-me?lat=${origin.lat}&lng=${origin.lng}&meal=${meal}`, { timeout: 60_000 });
      expect(res.ok()).toBeTruthy();
      const data = (await res.json()) as { restaurants: { restaurantName: string }[] };
      for (const r of data.restaurants) {
        expect(
          NON_WALKIN.test(r.restaurantName),
          `${origin.name}/${meal}: non-walk-in venue "${r.restaurantName}" in ranked picks`,
        ).toBe(false);
      }
    }
  }
});
