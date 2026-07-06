import { test, expect, type Page } from "@playwright/test";

// Round 4 P0: the results race condition. July 5 audit — with a saved LIC
// location the homepage fired BOTH a Times Square fetch and a LIC fetch, and
// rendered whichever resolved last (Times Square venues under the LIC banner).
// After the fix: (1) no fetch ever fires with the fallback location when a
// persisted location exists, (2) a superseded response can never render.

const LIC = { lat: 40.74523, lng: -73.953506 };
const TIMES_SQUARE_LAT = "40.758";
const CARDS = 'a[href^="/restaurants/"], button:has-text("min walk")';

function seedLicLocation(page: Page) {
  return page.addInitScript(
    ([lat, lng]) => {
      window.localStorage.setItem(
        "pulsenyc:lastLocation",
        JSON.stringify({ lat, lng, label: "47-10 Vernon Blvd", source: "manual", ts: Date.now() }),
      );
    },
    [LIC.lat, LIC.lng] as [number, number],
  );
}

async function renderedCardNames(page: Page): Promise<string[]> {
  const cards = page.locator(CARDS).filter({ hasText: /min walk/ });
  await expect(cards.first()).toBeVisible({ timeout: 30_000 });
  const count = await cards.count();
  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    names.push((await cards.nth(i).locator("p.font-semibold").first().innerText()).trim());
  }
  return names;
}

test.describe("results race condition (P0)", () => {
  test("seeded LIC location: no fallback fetch, rendered venues are the LIC API's venues", async ({ page, request }) => {
    await seedLicLocation(page);

    const nearMeUrls: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/smart-menu/near-me")) nearMeUrls.push(req.url());
    });

    await page.goto("/");
    const rendered = await renderedCardNames(page);
    expect(rendered.length).toBeGreaterThan(0);

    // Layer 1: the Times Square fallback must never have been queried
    for (const url of nearMeUrls) {
      expect(url, `fallback-location fetch fired: ${url}`).not.toContain(`lat=${TIMES_SQUARE_LAT}&`);
    }
    // Every fetch used the seeded LIC coords
    expect(nearMeUrls.length).toBeGreaterThan(0);
    for (const url of nearMeUrls) {
      expect(url).toContain(`lat=${LIC.lat}`);
      expect(url).toContain(`lng=${LIC.lng}`);
    }

    // Cross-check: call the exact same API the page called; rendered names
    // must be a subset of what the LIC origin returns.
    const apiRes = await request.get(nearMeUrls[nearMeUrls.length - 1]);
    expect(apiRes.ok()).toBeTruthy();
    const apiData = (await apiRes.json()) as { restaurants: { restaurantName: string; walkMinutes: number }[] };
    const apiNames = new Set(apiData.restaurants.map((r) => r.restaurantName));
    for (const name of rendered) {
      expect(apiNames.has(name), `rendered venue "${name}" not in LIC API response`).toBeTruthy();
    }
    // Radius sanity: the API's own walk times are within the 10-minute promise
    for (const r of apiData.restaurants) {
      expect(r.walkMinutes, `${r.restaurantName} outside radius`).toBeLessThanOrEqual(11);
    }
  });

  test("seeded LIC location under slow network: still LIC venues", async ({ page, request }) => {
    await seedLicLocation(page);

    // Throttle every near-me response by 1.5s — a slow network must delay,
    // never corrupt, the result set.
    const nearMeUrls: string[] = [];
    await page.route("**/api/smart-menu/near-me**", async (route) => {
      nearMeUrls.push(route.request().url());
      const res = await route.fetch();
      await new Promise((r) => setTimeout(r, 1_500));
      await route.fulfill({ response: res });
    });

    await page.goto("/");
    const rendered = await renderedCardNames(page);

    for (const url of nearMeUrls) {
      expect(url, `fallback-location fetch fired: ${url}`).not.toContain(`lat=${TIMES_SQUARE_LAT}&`);
    }
    const apiRes = await request.get(nearMeUrls[nearMeUrls.length - 1]);
    const apiData = (await apiRes.json()) as { restaurants: { restaurantName: string }[] };
    const apiNames = new Set(apiData.restaurants.map((r) => r.restaurantName));
    for (const name of rendered) {
      expect(apiNames.has(name), `rendered venue "${name}" not in LIC API response`).toBeTruthy();
    }
  });

  test("location change mid-flight: the delayed stale response never renders", async ({ page, request }) => {
    // No seed — the page legitimately starts on the Times Square fallback.
    // Delay THAT response by 4s, then switch to LIC while it's in flight (the
    // audit's exact stale-response-wins shape, inverted to be deterministic).
    await page.route("**/api/smart-menu/near-me**", async (route) => {
      const url = route.request().url();
      const res = await route.fetch();
      if (url.includes(`lat=${TIMES_SQUARE_LAT}&`)) {
        await new Promise((r) => setTimeout(r, 4_000));
      }
      await route.fulfill({ response: res });
    });

    // Register the wait BEFORE goto — the fetch fires from a mount effect and
    // can beat the load event.
    const tsRequest = page.waitForRequest((req) => req.url().includes(`lat=${TIMES_SQUARE_LAT}&`), { timeout: 20_000 });
    await page.goto("/");
    // Wait until the page has fired its Times Square request, then change
    // location through the shared store (same event the WHERE control uses).
    const meal = new URL((await tsRequest).url()).searchParams.get("meal") ?? "lunch";
    await page.evaluate(([lat, lng]) => {
      const stored = { lat, lng, label: "47-10 Vernon Blvd", source: "manual", ts: Date.now() };
      window.localStorage.setItem("pulsenyc:lastLocation", JSON.stringify(stored));
      window.dispatchEvent(new CustomEvent("pulsenyc-location-change", { detail: stored }));
    }, [LIC.lat, LIC.lng] as [number, number]);

    // Give the delayed Times Square response time to land (and be discarded)
    await page.waitForTimeout(6_000);
    const rendered = await renderedCardNames(page);

    const apiRes = await request.get(`/api/smart-menu/near-me?lat=${LIC.lat}&lng=${LIC.lng}&meal=${meal}`);
    const licData = (await apiRes.json()) as { restaurants: { restaurantName: string }[] };
    const tsRes = await request.get(`/api/smart-menu/near-me?lat=40.758&lng=-73.9855&meal=${meal}`);
    const tsData = (await tsRes.json()) as { restaurants: { restaurantName: string }[] };
    const licNames = new Set(licData.restaurants.map((r) => r.restaurantName));
    const tsOnly = new Set(tsData.restaurants.map((r) => r.restaurantName).filter((n) => !licNames.has(n)));

    for (const name of rendered) {
      expect(tsOnly.has(name), `stale Times Square venue rendered after location change: "${name}"`).toBeFalsy();
    }
  });
});
