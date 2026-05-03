/**
 * globalTeardown.ts — Runs ONCE after all tests finish.
 *
 * Responsibilities:
 *  • Print a summary of report locations
 *  • Clean up temporary files if needed
 *  • Log total run duration
 *
 * Registered in playwright.config.ts via `globalTeardown`.
 */
import * as fs from "fs";
import * as path from "path";

export default async function globalTeardown(): Promise<void> {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║     Goibibo Playwright Framework — Global Teardown   ║");
  console.log("╚══════════════════════════════════════════════════════╝");

  // ── Report paths ────────────────────────────────────────────────
  const reports = [
    { label: "HTML Report",    path: "reports/playwright-html/index.html" },
    { label: "JUnit XML",      path: "reports/results.xml"                },
    { label: "JSON Results",   path: "reports/results.json"               },
    { label: "Allure Results", path: "allure-results"                     },
  ];

  console.log("\n  📊 Report Locations:");
  for (const r of reports) {
    const resolved = path.resolve(r.path);
    const exists   = fs.existsSync(resolved);
    const icon     = exists ? "✅" : "⬜";
    console.log(`  ${icon} ${r.label.padEnd(16)} → ${resolved}`);
  }

  console.log("\n  💡 To view the HTML report:");
  console.log("     npx playwright show-report reports/playwright-html\n");

  console.log("  💡 To view the Allure report:");
  console.log("     npx allure serve allure-results\n");

  console.log("  🏁 All done.\n");
}
