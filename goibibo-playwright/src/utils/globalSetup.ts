/**
 * globalSetup.ts — Runs ONCE before all tests start.
 *
 * Responsibilities:
 *  • Verify the target URL is reachable
 *  • Ensure test-data Excel file exists (auto-generate if missing)
 *  • Create report output directories
 *  • Log environment info for the CI run summary
 *
 * Registered in playwright.config.ts via `globalSetup`.
 */
import { chromium, FullConfig } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use?.baseURL ?? "https://www.goibibo.com";

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║      Goibibo Playwright Framework — Global Setup     ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log(`  Base URL  : ${baseURL}`);
  console.log(`  Node.js   : ${process.version}`);
  console.log(`  Timestamp : ${new Date().toISOString()}`);
  console.log(`  Headless  : ${process.env.HEADLESS !== "false"}`);
  console.log("");

  // ── 1. Ensure report directories exist ─────────────────────────
  const dirs = [
    "reports/playwright-html",
    "reports/test-results",
    "allure-results",
  ];
  for (const dir of dirs) {
    const resolved = path.resolve(dir);
    if (!fs.existsSync(resolved)) {
      fs.mkdirSync(resolved, { recursive: true });
      console.log(`  ✅ Created directory: ${dir}`);
    }
  }

  // ── 2. Auto-generate Excel test data if missing ─────────────────
  const excelPath = path.resolve(
    process.env.EXCEL_FILE_PATH ?? "./test-data/TestData.xlsx"
  );
  if (!fs.existsSync(excelPath)) {
    console.log("  ⚠️  TestData.xlsx not found — generating...");
    try {
      // Dynamic import to avoid circular dependency issues
      const { execSync } = await import("child_process");
      execSync("npx ts-node src/utils/createTestData.ts", { stdio: "inherit" });
      console.log("  ✅ TestData.xlsx generated");
    } catch (err) {
      console.warn("  ⚠️  Could not auto-generate Excel — tests will use config defaults.");
    }
  } else {
    console.log(`  ✅ Test data file found: ${excelPath}`);
  }

  // ── 3. Smoke-check: verify goibibo.com is reachable ─────────────
  console.log(`\n  🌐 Checking connectivity to ${baseURL}...`);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const response = await page.goto(baseURL, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    if (response && response.ok()) {
      console.log(`  ✅ Site reachable (HTTP ${response.status()})`);
    } else {
      console.warn(`  ⚠️  Site returned HTTP ${response?.status()} — tests may fail`);
    }
    await page.close();
  } catch (err) {
    console.warn(`  ⚠️  Could not reach ${baseURL}: ${(err as Error).message}`);
    console.warn("     Tests will still run — individual tests will handle navigation errors.");
  } finally {
    await browser.close();
  }

  console.log("\n  🚀 Global setup complete — starting tests...\n");
}
