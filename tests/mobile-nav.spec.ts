import { test, expect } from "@playwright/test";

// Runs in the "mobile" Playwright project (iPhone SE, 375px) — see
// playwright.config.ts testMatch. This had never been pixel-verified.

test("375px: hamburger visible, desktop nav hidden, drawer opens on tap", async ({ page }) => {
  await page.goto("/");

  const hamburger = page.getByRole("button", { name: "Open menu" });
  await expect(hamburger).toBeVisible();

  // Desktop tab nav must be hidden at 375px (md:hidden / hidden md:flex split)
  const desktopNav = page.locator("nav").filter({ hasText: "Overview" }).first();
  if (await desktopNav.count()) {
    await expect(desktopNav).toBeHidden();
  }

  // Drawer opens on tap and shows the grouped menu + close button
  await hamburger.tap();
  const closeBtn = page.getByRole("button", { name: "Close menu" });
  await expect(closeBtn).toBeVisible();

  // And closes again
  await closeBtn.tap();
  await expect(closeBtn).toBeHidden();
});
