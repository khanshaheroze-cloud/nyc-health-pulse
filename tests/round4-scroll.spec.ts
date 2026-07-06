import { test, expect } from "@playwright/test";

// Round 4 P1: scroll/paint reliability. July 5 audit — wheel input over the
// hero failed to move the page, and after keyboard scrolling the viewport
// painted blank cream at positions that contain content. Fixes: native scroll
// (no global smooth-scroll), no whole-page transform layer, reveal animations
// never dip below 0.6 opacity.

test.describe("scroll/paint reliability", () => {
  test("wheel-scroll from the top moves the page every time (no dead zones)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle").catch(() => {});
    // Cursor over the hero — the audit's exact dead zone
    await page.mouse.move(768, 300);

    let last = 0;
    let reachedBottom = false;
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 700);
      await page.waitForTimeout(250);
      const { y, max } = await page.evaluate(() => ({
        y: window.scrollY,
        max: document.body.scrollHeight - window.innerHeight,
      }));
      if (y >= max - 2) { reachedBottom = true; break; } // document end, not a dead zone
      expect(y, `wheel step ${i + 1} did not scroll (stuck at ${last})`).toBeGreaterThan(last);
      last = y;
    }
    // Either we wheeled clean through to the footer, or we traveled far
    expect(reachedBottom || last > 2000, `traveled ${last}, bottom=${reachedBottom}`).toBeTruthy();
  });

  test("every scroll position paints content (no blank frames)", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator('[data-testid="ranked-grid"]');
    await expect(cards).toBeVisible({ timeout: 30_000 });

    const total = await page.evaluate(() => document.body.scrollHeight - window.innerHeight);
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      const y = Math.round((total * i) / steps);
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(350); // let paint settle
      // 1) Content must exist under the viewport midpoint
      const hasContent = await page.evaluate(() => {
        const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
        return !!el && el !== document.body && el !== document.documentElement;
      });
      expect(hasContent, `no content element at scroll ${y}`).toBeTruthy();
      // 2) The frame is not a uniform blank — a solid-cream viewport compresses
      //    to a tiny PNG; painted content is far larger
      const shot = await page.screenshot({ clip: { x: 0, y: 0, width: 1280, height: 700 } });
      expect(shot.length, `blank frame at scroll ${y} (png ${shot.length}B)`).toBeGreaterThan(15_000);
    }
  });

  test("no reveal element is ever fully transparent", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[data-testid="ranked-grid"]')).toBeVisible({ timeout: 30_000 });
    const minOpacity = await page.evaluate(() => {
      let min = 1;
      document.querySelectorAll(".reveal-on-scroll").forEach((el) => {
        const o = parseFloat(getComputedStyle(el).opacity);
        if (o < min) min = o;
      });
      return min;
    });
    expect(minOpacity).toBeGreaterThanOrEqual(0.5);
  });
});
