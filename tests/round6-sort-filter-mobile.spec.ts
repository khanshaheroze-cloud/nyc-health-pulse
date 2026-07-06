import { test } from "@playwright/test";
import { runSortFilterScenario } from "./helpers/sortFilterIdempotence";

// Round 6 P0 (375px) — same owner repro as round6-sort-filter.spec.ts, run in
// the mobile project (Pixel 5 descriptor forced to the audit's 375px width).

test("sort chips re-order and filters subset — never append, never duplicate (375px)", async ({ page }) => {
  test.setTimeout(120_000);
  await runSortFilterScenario(page);
});
