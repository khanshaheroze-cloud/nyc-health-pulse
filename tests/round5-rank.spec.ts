import { test, expect } from "@playwright/test";
import { isDessertBrand, isAllowlistedFoodBar } from "../src/lib/venuePolicy";

// Round 5 P0: a venue with no coherent picks must never occupy a ranked slot,
// and dessert/bubble-tea brands are blocked by name (DOHMH cuisine lies —
// Mango Mango is licensed "Fruits/Vegetables" and ranked #4 with zero picks).

test.describe("dessert-brand blocklist", () => {
  test("Mango Mango and bubble-tea brands are blocked", () => {
    expect(isDessertBrand("MANGO MANGO")).toBe(true);
    expect(isDessertBrand("MANGO MANGO DESSERT")).toBe(true);
    expect(isDessertBrand("TIGER SUGAR")).toBe(true);
    expect(isDessertBrand("KUNG FU TEA #42")).toBe(true);
  });

  test("real food venues are not blocked", () => {
    expect(isDessertBrand("MANGO THAI KITCHEN")).toBe(false);
    expect(isDessertBrand("WOODBINES")).toBe(false);
    expect(isDessertBrand("SWEETGREEN")).toBe(false);
  });

  test("allowlist matches Woodbines and Gantry", () => {
    expect(isAllowlistedFoodBar("WOODBINES")).toBe(true);
    expect(isAllowlistedFoodBar("GANTRY BAR & KITCHEN")).toBe(true);
    expect(isAllowlistedFoodBar("MCSORLEY'S OLD ALE HOUSE")).toBe(false);
  });
});

const LIC = "lat=40.74523&lng=-73.953506";

test.describe("near-me API — ranking exclusions (LIC audit coords)", () => {
  for (const meal of ["lunch", "dinner", "snack"] as const) {
    test(`${meal}: no dessert brand in results; pickless venues only after ranked candidates`, async ({ request }) => {
      const res = await request.get(`/api/smart-menu/near-me?${LIC}&meal=${meal}`, { timeout: 60_000 });
      const data = (await res.json()) as {
        restaurants: { restaurantName: string; topPicks: unknown[] }[];
      };
      for (const r of data.restaurants) {
        expect(isDessertBrand(r.restaurantName), `dessert brand ranked: ${r.restaurantName}`).toBe(false);
      }
      // Once the guidance-only tail starts, no pick-bearing venue may follow —
      // pickless venues can never sit above ranked candidates.
      const firstEmpty = data.restaurants.findIndex((r) => r.topPicks.length === 0);
      if (firstEmpty !== -1) {
        for (const r of data.restaurants.slice(firstEmpty)) {
          expect(r.topPicks.length, `pick-bearing venue after guidance tail: ${r.restaurantName}`).toBe(0);
        }
      }
    });
  }
});

test("ranked grid contains no guidance-only card; guidance section is separate", async ({ page }) => {
  await page.goto("/");
  const ranked = page.locator('[data-testid="ranked-grid"]');
  await expect(ranked).toBeVisible({ timeout: 30_000 });
  // Every ranked card must carry an "Order:" line — the guidance fallback
  // ("Smart ordering tips") may never occupy a ranked slot.
  const guidanceInRanked = ranked.locator("a, button").filter({ hasText: /Smart ordering tips/ });
  expect(await guidanceInRanked.count()).toBe(0);
  // If a guidance section renders, it sits below the ranked grid and is labeled
  const guidance = page.locator('[data-testid="guidance-section"]');
  if ((await guidance.count()) > 0 && (await guidance.isVisible())) {
    await expect(guidance).toContainText(/ordering guidance only/i);
    const rankedBox = await ranked.boundingBox();
    const gBox = await guidance.boundingBox();
    expect(gBox!.y).toBeGreaterThan(rankedBox!.y);
  }
});
