import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // ── Test discovery ──────────────────────────────────────────────
  testDir: "./src/tests",
  testMatch: "**/*.spec.ts",

  // ── Global hooks ────────────────────────────────────────────────
  globalSetup:    "./src/utils/globalSetup.ts",
  globalTeardown: "./src/utils/globalTeardown.ts",

  // ── Global settings ─────────────────────────────────────────────
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,   // Goibibo UI is stateful – run serially
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 1,

  // ── Reporters ───────────────────────────────────────────────────
  reporter: [
    ["list"],
    // Built-in Playwright HTML report (primary)
    ["html",  { outputFolder: "reports/playwright-html", open: "never" }],
    // JUnit XML — TestNG-compatible for CI/CD
    ["junit", { outputFile: "reports/results.xml" }],
    // JSON for machine-readable results
    ["json",  { outputFile: "reports/results.json" }],
    // Custom Extent-style HTML report
    ["./src/utils/extentReporter.ts", { outputFile: "reports/extent-report.html" }],
  ],

  // ── Shared browser settings ──────────────────────────────────────
  use: {
    baseURL: process.env.BASE_URL ?? "https://www.goibibo.com",
    headless: process.env.HEADLESS !== "false",
    viewport: { width: 1280, height: 720 },
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    ignoreHTTPSErrors: true,
  },

  // ── Projects (browsers) ─────────────────────────────────────────
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],

  // ── Output dirs ─────────────────────────────────────────────────
  outputDir: "reports/test-results",
});
