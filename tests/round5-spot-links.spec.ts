import { test, expect } from "@playwright/test";

// Round 5 P1: /spot/50096385 (R40 — a local venue whose picks are labeled
// estimates on the same page) rendered "✓ Verified menu & prices →" linking to
// /restaurants/r40, which 404s. A false verification claim AND a dead link on
// the shareable SEO page. The link may only render when the target page is
// real (chain or menu-verified venue); local venues get the methodology link.

const R40_CAMIS = "50096385";

test("R40 /spot page: no 'Verified' claim, no dead links", async ({ page, request }) => {
  const res = await page.goto(`/spot/${R40_CAMIS}`);
  expect(res!.status()).toBe(200);
  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/Verified menu & prices/i);
  // The honest replacement is present
  await expect(page.getByRole("link", { name: /How we estimate picks/i })).toBeVisible();

  // Every internal href on the page must resolve (no 404s on a shareable page)
  const hrefs = await page.$$eval("a[href^='/']", (as) => as.map((a) => a.getAttribute("href")!));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of new Set(hrefs)) {
    const r = await request.get(href!, { timeout: 30_000 });
    expect(r.status(), `dead link on /spot/${R40_CAMIS}: ${href} → ${r.status()}`).toBeLessThan(400);
  }
});

test("sampled /spot pages from live results have zero dead internal links", async ({ page, request }) => {
  // Sample real CAMIS ids from the near-me API (generic venues carry camis)
  const api = await request.get(`/api/smart-menu/near-me?lat=40.74523&lng=-73.953506&meal=lunch`, { timeout: 60_000 });
  const data = (await api.json()) as { restaurants: { camis?: string | null }[] };
  const camisIds = data.restaurants.map((r) => r.camis).filter((c): c is string => !!c).slice(0, 3);
  expect(camisIds.length).toBeGreaterThan(0);

  for (const camis of camisIds) {
    const res = await page.goto(`/spot/${camis}`);
    expect(res!.status(), `/spot/${camis} did not render`).toBe(200);
    const hrefs = await page.$$eval("a[href^='/']", (as) => as.map((a) => a.getAttribute("href")!));
    for (const href of new Set(hrefs)) {
      const r = await request.get(href!, { timeout: 30_000 });
      expect(r.status(), `dead link on /spot/${camis}: ${href} → ${r.status()}`).toBeLessThan(400);
    }
    // A "Verified" link on an unverified venue is a false claim — only allowed
    // when it points at a real chain/verified page (checked above), and never
    // rendered alongside the estimates disclaimer without verification.
    const claimsVerified = await page.getByText(/Verified menu & prices/i).count();
    if (claimsVerified > 0) {
      const verifiedHref = await page.getByRole("link", { name: /Verified menu & prices/i }).getAttribute("href");
      const r = await request.get(verifiedHref!, { timeout: 30_000 });
      expect(r.status(), `verified link 404s: ${verifiedHref}`).toBeLessThan(400);
    }
  }
});
