import { test, expect } from "@playwright/test";

// Round-2 (June 2026 post-deploy audit) regression coverage:
// redirects, venue-page JSON-LD, single email capture, eat-smart
// NEARBY renders within the 12s client timeout, pin popups.

const LIC = { lat: 40.7447, lng: -73.9485, label: "Long Island City", source: "manual" as const };

const NEARBY_FIXTURE = {
  results: [
    {
      name: "Sweetgreen", rawName: "SWEETGREEN", cuisine: "Salads", grade: "A", score: 10,
      address: "4720 Center Blvd Queens 11109", lat: 40.7451, lng: -73.958,
      distance: 320, chainSlug: "sweetgreen", isHealthy: true,
    },
    {
      name: "Mercato LIC", rawName: "MERCATO LIC", cuisine: "Italian", grade: "A", score: 9,
      address: "4747 Vernon Blvd Queens 11101", lat: 40.7442, lng: -73.9535,
      distance: 410, chainSlug: null, isHealthy: false,
    },
  ],
  meta: { totalRaw: 2, totalDeduped: 2, totalResults: 2, radiusMeters: 805 },
};

test.describe("redirects", () => {
  test("/pulsescore 308s to /methodology", async ({ request }) => {
    const res = await request.get("/pulsescore", { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers()["location"]).toContain("/methodology");
  });

  test("/active 308s to /run-routes", async ({ request }) => {
    const res = await request.get("/active", { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers()["location"]).toContain("/run-routes");
  });
});

test.describe("venue pages", () => {
  test("/restaurants/chipotle has own canonical + Restaurant JSON-LD", async ({ page }) => {
    const resp = await page.goto("/restaurants/chipotle");
    expect(resp?.status()).toBe(200);

    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toBe("https://pulsenyc.app/restaurants/chipotle");

    // The layout emits a site-wide WebSite JSON-LD first — find the Restaurant one
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const restaurant = blocks.map((b) => JSON.parse(b)).find((p) => p["@type"] === "Restaurant");
    expect(restaurant).toBeTruthy();
    expect(restaurant.name).toBeTruthy();
  });
});

test.describe("homepage capture", () => {
  test("exactly one email-capture module renders", async ({ page }) => {
    await page.goto("/");
    // Waitlist capture appears only after results load
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 20_000 });
    expect(await page.locator('input[type="email"]').count()).toBe(1);
  });
});

test.describe("eat-smart nearby", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/nearby-food**", (route) => route.fulfill({ json: NEARBY_FIXTURE }));
    // Seed the shared location store so the map/list path runs without geolocation
    await page.addInitScript((loc) => {
      localStorage.setItem("pulsenyc:lastLocation", JSON.stringify({ ...loc, ts: Date.now() }));
    }, LIC);
  });

  test("NEARBY list renders (not error state) within 12s", async ({ page }) => {
    await page.goto("/eat-smart");
    await expect(page.getByText("Nearby", { exact: true })).toBeVisible({ timeout: 12_000 });
    await expect(page.getByText("Sweetgreen").first()).toBeVisible({ timeout: 3_000 });
    await expect(page.getByText("Couldn't load restaurants")).toHaveCount(0);
  });

  test("clicking a map pin opens a popup or highlights the matching card", async ({ page }) => {
    await page.goto("/eat-smart");
    await expect(page.getByText("Nearby", { exact: true })).toBeVisible({ timeout: 12_000 });

    // :not(:empty) skips the user-location dot (an empty div with no popup);
    // restaurant pins are wrappers containing the icon circle + tail
    const marker = page.locator(".mapboxgl-marker:not(:empty)").first();
    try {
      await marker.waitFor({ state: "visible", timeout: 15_000 });
    } catch {
      // Mapbox GL needs WebGL + a token — absent in some CI runners. The
      // handler wiring itself is unit-visible in _EatSmartMapHeroImpl.
      test.skip(true, "Mapbox markers unavailable in this environment (no WebGL/token)");
      return;
    }

    // dispatchEvent instead of a positional click: fitBounds animates the map
    // under the cursor, which makes coordinate-based clicks land on the canvas
    await marker.dispatchEvent("click");
    // Pin click opens the Mapbox popup AND highlights the matching card
    // (selectedId adds ring-2 to the [data-spot-id] card)
    const popup = page.locator(".mapboxgl-popup");
    const highlighted = page.locator("[data-spot-id].ring-2");
    await expect(popup.or(highlighted).first()).toBeVisible({ timeout: 5_000 });
  });
});
