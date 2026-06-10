import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  fullyParallel: true,
  // Local runs hit the dev server, which cold-compiles routes AND fetches live
  // APIs — 14+ parallel first-hits starve it into goto timeouts. CI uses the
  // prebuilt prod server and can parallelize freely.
  workers: process.env.CI ? undefined : 6,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile/ },
    // 375px viewport project for the mobile nav regression test
    // (Pixel 5 descriptor = Chromium-based; viewport forced to the audit's 375px)
    {
      name: "mobile",
      use: { ...devices["Pixel 5"], viewport: { width: 375, height: 667 } },
      testMatch: /mobile/,
    },
  ],
  webServer: {
    // CI runs the production build (next start); locally reuse the dev server
    command: process.env.CI ? "pnpm start" : "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
