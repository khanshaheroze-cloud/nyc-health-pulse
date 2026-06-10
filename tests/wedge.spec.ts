import { test, expect } from "@playwright/test";

// Wedge-sprint regressions: price anchor, subway-stop input, link integrity,
// sitemap inversion, analytics wiring.

const CARDS = 'a[href^="/restaurants/"], button:has-text("min walk")';

test.describe("price anchor", () => {
  test("every result card shows an order price (exact or band)", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator(CARDS).filter({ hasText: /min walk/ });
    await expect(cards.first()).toBeVisible({ timeout: 20_000 });
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const text = (await cards.nth(i).innerText()).replace(/\s+/g, " ");
      if (/Smart ordering tips/.test(text)) continue;
      expect(text, `card missing price: ${text}`).toMatch(/~\$\d+(–|-)?\d*\+?/);
    }
  });

  test("Under $15 toggle filters results", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator(CARDS).filter({ hasText: /min walk/ });
    await expect(cards.first()).toBeVisible({ timeout: 20_000 });

    const chip = page.getByRole("button", { name: /Under \$15/ });
    await expect(chip).toBeVisible();

    // Force it ON regardless of meal-based default, then every visible card
    // must be in an under-$15 band (~$15+ cards excluded)
    if ((await chip.getAttribute("aria-pressed")) !== "true") await chip.click();
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });
    const onCount = await cards.count();
    for (let i = 0; i < onCount; i++) {
      const text = (await cards.nth(i).innerText()).replace(/\s+/g, " ");
      expect(text, `over-$15 card with filter on: ${text}`).not.toMatch(/~\$15\+/);
    }

    // Toggling OFF must not break results
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "false");
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });
  });
});

test("subway-stop autocomplete geocodes to the station", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /WHERE/i }).click();
  await page.getByLabel("Or enter an address").fill("vernon blvd");
  const stationOption = page.getByRole("option").filter({ hasText: /near Vernon Blvd-Jackson Av/ });
  await expect(stationOption.first()).toBeVisible({ timeout: 10_000 });
  await stationOption.first().click();
  // The WHERE badge now shows the station, and results reload for LIC
  await expect(page.getByRole("button", { name: /WHERE/i })).toContainText("Vernon Blvd-Jackson Av");
});

test("no /restaurants/* link on the homepage 404s", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator(CARDS).filter({ hasText: /min walk/ }).first()).toBeVisible({ timeout: 20_000 });
  const hrefs = await page.$$eval('a[href^="/restaurants/"]', (as) => as.map((a) => a.getAttribute("href")));
  const unique = [...new Set(hrefs.filter((h): h is string => !!h))];
  for (const href of unique) {
    const res = await request.get(href);
    expect(res.status(), `${href} should not 404`).not.toBe(404);
  }
});

test.describe("sitemap", () => {
  test("includes the wedge surfaces and every URL responds", async ({ request }) => {
    // ~120 URLs: the prebuilt CI server crawls all of them; the local dev
    // server (which compiles each route on first hit) checks the food
    // surfaces fully plus a sample of the long tail.
    test.setTimeout(420_000);

    const res = await request.get("/sitemap.xml");
    expect(res.ok()).toBeTruthy();
    const xml = await res.text();

    for (const must of ["https://pulsenyc.app/eat-smart", "https://pulsenyc.app/app", "https://pulsenyc.app/guides", "https://pulsenyc.app/restaurants/chipotle"]) {
      expect(xml, `sitemap missing ${must}`).toContain(`<loc>${must}</loc>`);
    }

    const urls = [...xml.matchAll(/<loc>https:\/\/pulsenyc\.app([^<]*)<\/loc>/g)].map((m) => m[1] || "/");
    expect(urls.length).toBeGreaterThan(50);

    const food = urls.filter((u) => u === "/" || /^\/(eat-smart|app|guides|restaurants|methodology)/.test(u));
    const rest = urls.filter((u) => !food.includes(u));
    const sampled = process.env.CI ? rest : rest.filter((_, i) => i % 8 === 0);
    const toCheck = [...food, ...sampled];

    const chunkSize = 5;
    for (let i = 0; i < toCheck.length; i += chunkSize) {
      const chunk = toCheck.slice(i, i + chunkSize);
      const results = await Promise.all(chunk.map(async (u) => ({ u, status: (await request.get(u, { timeout: 60_000 })).status() })));
      for (const r of results) {
        expect(r.status, `${r.u} returned ${r.status}`).toBe(200);
      }
    }
  });
});

test.describe("analytics wiring", () => {
  test("find_food_search event fires on the homepage search", async ({ page }) => {
    const events: string[] = [];
    await page.route("**/api/events", async (route) => {
      const body = route.request().postDataJSON() as { event?: string };
      if (body?.event) events.push(body.event);
      await route.fulfill({ json: { ok: true } });
    });
    await page.goto("/");
    await expect(page.locator(CARDS).filter({ hasText: /min walk/ }).first()).toBeVisible({ timeout: 20_000 });
    expect(events).toContain("find_food_search");
  });

  test("signup posts list + source to /api/subscribe", async ({ page }) => {
    let captured: { list?: string; source?: string } | null = null;
    await page.route("**/api/subscribe", async (route) => {
      captured = route.request().postDataJSON();
      await route.fulfill({ json: { ok: true } });
    });
    await page.goto("/guides");
    await page.getByPlaceholder("you@example.com").fill("playwright-test@example.com");
    await page.getByRole("button", { name: "Subscribe" }).click();
    await expect(page.getByText(/You're in/)).toBeVisible({ timeout: 5_000 });
    expect(captured).not.toBeNull();
    expect(captured!.list).toBe("newsletter");
    expect(captured!.source).toBeTruthy();
  });
});
