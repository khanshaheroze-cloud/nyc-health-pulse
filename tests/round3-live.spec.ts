import { test, expect } from "@playwright/test";

// Server-level checks (run against the Playwright webServer).

test("apple-icon.png serves a real PNG (200 image/png, no redirect)", async ({ request }) => {
  const res = await request.get("/apple-icon.png", { maxRedirects: 0 });
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
});

test("/nutrition-tracker has its own canonical + SSR H1", async ({ request }) => {
  const html = await (await request.get("/nutrition-tracker")).text();
  expect(html).toContain('rel="canonical"');
  expect(html).toMatch(/href="[^"]*\/nutrition-tracker"/);
  expect(html).toContain("Nutrition Tracker");
});

test("/workouts has its own canonical", async ({ request }) => {
  const html = await (await request.get("/workouts")).text();
  expect(html).toMatch(/href="[^"]*\/workouts"/);
  expect(html).toContain('rel="canonical"');
});

test("/spot/[camis] renders SSR dossier + Restaurant JSON-LD", async ({ request }) => {
  // Pull a real Queens grade-A CAMIS at test time.
  let camis = "";
  try {
    const r = await request.get(
      "https://data.cityofnewyork.us/resource/43nn-pn8j.json?$where=boro='Queens' AND grade='A'&$select=camis&$limit=1",
      { timeout: 30_000 },
    );
    if (r.ok()) camis = (await r.json())?.[0]?.camis ?? "";
  } catch { /* upstream flaky */ }
  test.skip(!camis, "no CAMIS available from DOHMH (upstream throttled)");

  const res = await request.get(`/spot/${camis}`);
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toContain('"@type":"Restaurant"');
  expect(html).toMatch(/Get directions/i);
});

test("fresh visitor (no location) sees NYC in the live badge, not an IP neighborhood", async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.clear(); } catch {}
  });
  await page.goto("/");
  // The LIVE · time · place badge in the hero
  const badge = page.getByText(/LIVE ·/).first();
  await expect(badge).toBeVisible({ timeout: 20_000 });
  await expect(badge).toContainText("NYC");
});
