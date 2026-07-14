import { test, expect } from "@playwright/test";

// July 14 closeout — every venue the near-me API returns in `restaurants`
// carries a categoryChip (the "Didi's Healthy Delights" chip:null fix).
// Runs against the local dev server; holds with the Places layer dark or live.

test("no chipless cards at the Astoria validation cell", async ({ request }) => {
  const res = await request.get("/api/smart-menu/near-me?lat=40.7644&lng=-73.9235&meal=lunch");
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(data.restaurants.length).toBeGreaterThan(0);
  for (const r of data.restaurants) {
    expect(r.categoryChip, `${r.restaurantName} has no categoryChip`).toBeTruthy();
    expect(typeof r.categoryChip.label, `${r.restaurantName} chip label`).toBe("string");
    expect(r.categoryChip.label.length).toBeGreaterThan(0);
  }
});

test("no chipless cards at the LIC cell either", async ({ request }) => {
  const res = await request.get("/api/smart-menu/near-me?lat=40.7425&lng=-73.9536&meal=lunch");
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  for (const r of data.restaurants) {
    expect(r.categoryChip, `${r.restaurantName} has no categoryChip`).toBeTruthy();
  }
});
