import { test, expect } from "@playwright/test";

// Round 4 P0: the hero promises "under $15" — the ranked five must never
// contradict it (July 5 audit: Carmine's "~$16 est." at card #2). Over-$15
// venues render under the "Worth a splurge" divider, never inside the five.

const CARD_FILTER = { hasText: /min walk/ };

test.describe("under-$15 promise", () => {
  test("default view: no ranked-five card shows a price above $15", async ({ page }) => {
    await page.goto("/");
    const ranked = page.locator('[data-testid="ranked-grid"]');
    await expect(ranked).toBeVisible({ timeout: 30_000 });
    const cards = ranked.locator("a, button").filter(CARD_FILTER);
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(5);

    for (let i = 0; i < count; i++) {
      const text = (await cards.nth(i).innerText()).replace(/\s+/g, " ");
      // Exact prices over $15
      const exact = text.match(/~\$(\d+)(?![\d–-])/);
      if (exact) {
        expect(Number(exact[1]), `ranked card shows over-$15 price: ${text}`).toBeLessThanOrEqual(15);
      }
      // The ~$15+ band means the estimate itself exceeds the promise
      expect(text, `ranked card shows the $15+ band: ${text}`).not.toMatch(/~\$15\+/);
    }
  });

  test("splurge section, when present, sits OUTSIDE the ranked five and is labeled", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[data-testid="ranked-grid"]')).toBeVisible({ timeout: 30_000 });
    const splurge = page.locator('[data-testid="splurge-section"]');
    if ((await splurge.count()) > 0 && (await splurge.isVisible())) {
      await expect(splurge).toContainText(/Worth a splurge/i);
      // Splurge cards must not be counted inside the ranked grid
      const rankedBox = await page.locator('[data-testid="ranked-grid"]').boundingBox();
      const splurgeBox = await splurge.boundingBox();
      expect(splurgeBox!.y).toBeGreaterThan(rankedBox!.y);
    }
  });

  test("Under $15 chip ON removes the splurge section entirely", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[data-testid="ranked-grid"]')).toBeVisible({ timeout: 30_000 });
    const chip = page.getByRole("button", { name: /Under \$15/ });
    if ((await chip.getAttribute("aria-pressed")) !== "true") await chip.click();
    await expect(page.locator('[data-testid="splurge-section"]')).toHaveCount(0);
  });

  test("near-me API: no generic template pick is priced over $15", async ({ request }) => {
    for (const meal of ["breakfast", "lunch", "dinner"]) {
      const res = await request.get(`/api/smart-menu/near-me?lat=40.74523&lng=-73.953506&meal=${meal}`, { timeout: 60_000 });
      const data = (await res.json()) as { restaurants: { restaurantName: string; isGeneric: boolean; topPicks: { name: string; estPrice: number | null }[] }[] };
      for (const r of data.restaurants) {
        if (!r.isGeneric) continue;
        for (const p of r.topPicks) {
          expect(p.estPrice == null || p.estPrice <= 15, `${r.restaurantName} template pick "${p.name}" priced $${p.estPrice}`).toBeTruthy();
        }
      }
    }
  });
});
