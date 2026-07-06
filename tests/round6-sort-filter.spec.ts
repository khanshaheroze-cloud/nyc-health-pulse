import { test } from "@playwright/test";
import { runSortFilterScenario } from "./helpers/sortFilterIdempotence";

// Round 6 P0 (desktop) — sort/filter idempotence: the owner's exact repro.
// The 375px run lives in round6-sort-filter-mobile.spec.ts (mobile project).

test("sort chips re-order and filters subset — never append, never duplicate (desktop)", async ({ page }) => {
  test.setTimeout(120_000);
  await runSortFilterScenario(page);
});

// API param hygiene: sorting is client-side, so unknown query params must be
// ignored and answered normally (a probe with &sort=calories once hung 180s).
test("near-me API ignores unknown params: ?sort=calories returns 200 promptly", async ({ request }) => {
  const started = Date.now();
  const res = await request.get(
    `/api/smart-menu/near-me?lat=40.74523&lng=-73.953506&meal=lunch&sort=calories&foo=bar`,
    { timeout: 30_000 },
  );
  test.expect(res.status()).toBe(200);
  const data = (await res.json()) as { restaurants: unknown[] };
  test.expect(Array.isArray(data.restaurants)).toBe(true);
  test.expect(data.restaurants.length).toBeGreaterThan(0);
  test.expect(Date.now() - started).toBeLessThan(30_000);
});

// Unknown meal values fall back to lunch instead of leaking through
test("near-me API whitelists meal values", async ({ request }) => {
  const res = await request.get(
    `/api/smart-menu/near-me?lat=40.74523&lng=-73.953506&meal=brunch-injection`,
    { timeout: 30_000 },
  );
  test.expect(res.status()).toBe(200);
  const data = (await res.json()) as { restaurants: unknown[] };
  test.expect(data.restaurants.length).toBeGreaterThan(0);
});
