import { test, expect, Page } from "@playwright/test";

// The recurring bug: search hung forever on "Searching…" with no timeout or
// error state. These tests fail on any perpetual-spinner regression — the
// page must show either a dossier (Building Health Score) or the explicit
// error card within 15s, via BOTH the button-click and Enter-key paths.

const DOSSIER_OR_ERROR =
  /Building Health Score|No records found|try again|Network error|Failed to fetch/;

async function expectSettled(page: Page) {
  await expect(
    page.getByText(DOSSIER_OR_ERROR).first(),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Searching")).toHaveCount(0);
}

test("building safety search settles within 15s (button click)", async ({ page }) => {
  await page.goto("/building-health");
  await page.getByPlaceholder("e.g. 123 Main St").fill("350 5th Ave");
  await page.getByRole("button", { name: "Search" }).click();
  await expectSettled(page);
});

test("building safety search settles within 15s (Enter key)", async ({ page }) => {
  await page.goto("/building-health");
  const input = page.getByPlaceholder("e.g. 123 Main St");
  await input.fill("350 5th Ave");
  await input.press("Enter");
  await expectSettled(page);
});

test("API route itself responds within 10s", async ({ request }) => {
  const start = Date.now();
  const res = await request.get("/api/building-health?address=350+5th+Ave", {
    timeout: 12_000,
  });
  const elapsed = Date.now() - start;
  expect(res.ok()).toBeTruthy();
  expect(elapsed).toBeLessThan(10_000);
  const body = await res.json();
  expect(body).toHaveProperty("score");
  expect(body).toHaveProperty("sourceErrors");
});
