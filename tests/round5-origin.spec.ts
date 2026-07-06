import { test, expect } from "@playwright/test";

// Round 5 P2 — origin transparency: the user never infers the results origin
// from venue names; it's stated under the headline with a one-click fix, and
// every rendered result set reports its origin to the event stream.

test("origin line renders under the results headline and opens the location editor", async ({ page }) => {
  await page.goto("/");
  const origin = page.locator('[data-testid="origin-line"]');
  await expect(origin).toBeVisible({ timeout: 30_000 });
  await expect(origin).toContainText(/^Near /);
  const update = origin.getByRole("button", { name: /Update location/i });
  await expect(update).toBeVisible();
  await update.click();
  // The WHERE picker dialog opens with the address input focused
  const dialog = page.getByRole("dialog", { name: /Set your location/i });
  await expect(dialog).toBeVisible();
  await expect(page.locator("#address-lookup")).toBeFocused({ timeout: 3_000 });
});

test("results_rendered event carries origin {lat,lng,source}", async ({ page }) => {
  const events: { event: string; meta?: Record<string, unknown> }[] = [];
  await page.route("**/api/events", async (route) => {
    try {
      events.push(route.request().postDataJSON());
    } catch {}
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.goto("/");
  await expect(page.locator('[data-testid="ranked-grid"]')).toBeVisible({ timeout: 30_000 });
  await expect
    .poll(() => events.some((e) => e.event === "results_rendered"), { timeout: 15_000 })
    .toBe(true);
  const ev = events.find((e) => e.event === "results_rendered")!;
  expect(typeof ev.meta?.originLat).toBe("number");
  expect(typeof ev.meta?.originLng).toBe("number");
  expect(["default", "gps", "manual", "ip"]).toContain(ev.meta?.originSource);
  expect(typeof ev.meta?.count).toBe("number");
});
