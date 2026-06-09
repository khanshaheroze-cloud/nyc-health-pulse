import { test, expect } from "@playwright/test";

// Pins the bugs that recurred repeatedly per the June 2026 audit.

test.describe("Eat Smart rendered results", () => {
  test("homepage cards: no raw DOHMH names, no duplicate brands, cal+protein+grade shown", async ({ page }) => {
    await page.goto("/");
    // Default location (Times Square) renders results without geolocation
    const cards = page.locator('a[href^="/restaurants/"]').filter({ hasText: /min walk/ });
    await expect(cards.first()).toBeVisible({ timeout: 20_000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await cards.nth(i).innerText()).replace(/\s+/g, " ");

      // No ALL-CAPS raw venue names with store numbers ("DUNKIN' #350162")
      expect(text).not.toMatch(/[A-Z]{4,}\s#?\d/);

      // Every card shows protein, calories, and a DOHMH grade OR is an
      // ordering-tips card (no named pick by design)
      if (!/Smart ordering tips/.test(text)) {
        expect(text, `card missing protein: ${text}`).toMatch(/\d+g protein/);
        expect(text, `card missing calories: ${text}`).toMatch(/~?\d+ cal/);
        expect(text, `card missing grade: ${text}`).toMatch(/Grade [A-Z]/);
      }

      // No bars/lounges/desserts ranked as healthy picks
      expect(text).not.toMatch(/\b(lounge|cabaret|nightclub|tavern|pastry|donut|doughnut)\b/i);

      names.push(text);
    }

    // Brand dedupe: no two cards for the same venue name. The venue name is
    // the card's <p> (generic cards put their CATEGORY in a span above it).
    const seen: string[] = [];
    for (let i = 0; i < count; i++) {
      const venueName = (await cards.nth(i).locator("p").first().innerText()).trim().toLowerCase();
      expect(seen, `duplicate brand card: ${venueName}`).not.toContain(venueName);
      seen.push(venueName);
    }
  });
});

test("AQI parity: homepage hero within ±2 of /air-quality", async ({ page }) => {
  await page.goto("/");
  const homeAqiAttr = await page
    .locator('[data-testid="aqi-value"]')
    .first()
    .getAttribute("data-aqi", { timeout: 20_000 });
  const homeAqi = Number(homeAqiAttr);
  expect(Number.isFinite(homeAqi)).toBeTruthy();

  await page.goto("/air-quality");
  const pageAqiAttr = await page
    .locator('[data-testid="aqi-value"]')
    .first()
    .getAttribute("data-aqi", { timeout: 20_000 });
  const pageAqi = Number(pageAqiAttr);
  expect(Number.isFinite(pageAqi)).toBeTruthy();

  // Drifted repeatedly May 18 – Jun 4: the two surfaces showed different AQIs
  expect(Math.abs(homeAqi - pageAqi), `home=${homeAqi} air-quality=${pageAqi}`).toBeLessThanOrEqual(2);
});

test('maternal health "Leading Cause" is never "All"', async ({ page }) => {
  await page.goto("/maternal-health");
  const card = page.locator('[data-kpi="Leading Cause"]');
  await expect(card).toBeVisible({ timeout: 20_000 });
  const value = await card.innerText();
  // Regressed 3+ times: the aggregate "All" row ranked as the top cause
  expect(value).not.toMatch(/^\s*All\s*$/m);
  expect(value.trim().length).toBeGreaterThan(0);
});
