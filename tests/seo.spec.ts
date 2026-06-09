import { test, expect } from "@playwright/test";

// Guards the June 2026 SEO audit findings: every page shipped
// canonical=https://pulsenyc.app (homepage), donating its ranking signal,
// and /building-health rendered "… | Pulse NYC | Pulse NYC".

const ROUTES = [
  "/",
  "/air-quality",
  "/eat-smart",
  "/building-health",
  "/nutrition-tracker",
  "/workouts",
  "/app",
  "/run-routes",
  "/covid",
  "/flu",
  "/food-safety",
  "/neighborhood",
  "/safety",
  "/maternal-health",
  "/demographics",
  "/sources",
];

for (const route of ROUTES) {
  test(`canonical + title for ${route}`, async ({ page }) => {
    await page.goto(route);

    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    const expected = route === "/" ? "https://pulsenyc.app/" : `https://pulsenyc.app${route}`;
    // Accept with or without trailing slash on the homepage
    expect(canonical?.replace(/\/$/, "") || "").toBe(expected.replace(/\/$/, ""));

    const title = await page.title();
    expect(title).not.toContain("Pulse NYC | Pulse NYC");
    // Every non-home page title must carry exactly one "| Pulse NYC" suffix
    if (route !== "/") {
      expect(title.match(/\| Pulse NYC/g)?.length ?? 0).toBe(1);
    }

    // og:title must be page-specific (not the bare generic "Pulse NYC")
    const ogTitle = await page
      .locator('meta[property="og:title"]')
      .getAttribute("content");
    expect(ogTitle).toBeTruthy();
    expect(ogTitle).not.toBe("Pulse NYC");
  });
}
