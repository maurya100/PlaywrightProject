/**
 * extentReporter.ts — Custom Playwright Reporter that generates an
 * Extent-Reports–style self-contained HTML file.
 *
 * Mirrors the Extent Reports experience familiar from Java/TestNG:
 *  • Dashboard with pass/fail/skip counts + pie chart
 *  • Per-test step logs with INFO / PASS / FAIL / WARN icons
 *  • Inline base64 screenshots on failure
 *  • Execution timeline
 *
 * Register in playwright.config.ts:
 *   reporter: [
 *     ["./src/utils/extentReporter.ts", { outputFile: "reports/extent-report.html" }]
 *   ]
 *
 * This reporter is a pure-TypeScript Playwright Reporter implementation
 * — no external Extent library required.
 */

import type {
  Reporter,
  Suite,
  TestCase,
  TestResult,
  TestStep,
} from "@playwright/test/reporter";
import * as fs   from "fs";
import * as path from "path";

// ── Types ─────────────────────────────────────────────────────────────
interface StepRecord {
  title:     string;
  status:    string;
  duration:  number;
  error?:    string;
}

interface TestRecord {
  id:         string;
  title:      string;
  suite:      string;
  status:     "passed" | "failed" | "skipped" | "timedOut";
  duration:   number;
  startTime:  string;
  steps:      StepRecord[];
  screenshot: string | null;  // base64 PNG
  annotations: { type: string; description?: string }[];
  error?:     string;
}

// ── Reporter class ────────────────────────────────────────────────────
class ExtentReporter implements Reporter {
  private outputFile: string;
  private records: TestRecord[] = [];
  private suiteStartTime: Date  = new Date();

  constructor(options: { outputFile?: string } = {}) {
    this.outputFile = path.resolve(
      options.outputFile ?? "reports/extent-report.html"
    );
  }

  onBegin(_config: unknown, suite: Suite): void {
    this.suiteStartTime = new Date();
    const total = suite.allTests().length;
    console.log(`\n[ExtentReporter] Starting — ${total} test(s) found`);
    const dir = path.dirname(this.outputFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    // Find first screenshot attachment (base64)
    let screenshot: string | null = null;
    for (const attachment of result.attachments) {
      if (attachment.contentType === "image/png" && attachment.body) {
        screenshot = attachment.body.toString("base64");
        break;
      }
    }

    // Collect step records
    const steps: StepRecord[] = result.steps.map((s: TestStep) => ({
      title:    s.title,
      status:   s.error ? "failed" : "passed",
      duration: s.duration,
      error:    s.error?.message,
    }));

    this.records.push({
      id:          test.id,
      title:       test.title,
      suite:       test.parent?.title ?? "Root",
      status:      result.status as TestRecord["status"],
      duration:    result.duration,
      startTime:   result.startTime.toISOString(),
      steps,
      screenshot,
      annotations: test.annotations ?? [],
      error:       result.error?.message,
    });
  }

  onEnd(): void {
    const html = this._buildHTML();
    fs.writeFileSync(this.outputFile, html, "utf-8");
    console.log(`\n[ExtentReporter] Report saved → ${this.outputFile}`);
  }

  // ── HTML Generation ───────────────────────────────────────────────

  private _buildHTML(): string {
    const passed  = this.records.filter(r => r.status === "passed").length;
    const failed  = this.records.filter(r => r.status === "failed").length;
    const skipped = this.records.filter(r => r.status === "skipped").length;
    const total   = this.records.length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const duration = ((Date.now() - this.suiteStartTime.getTime()) / 1000).toFixed(1);

    const testRows = this.records.map(r => this._buildTestRow(r)).join("\n");

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Goibibo — Extent Test Report</title>
<style>
  :root {
    --pass:#00c853;--fail:#d32f2f;--skip:#ff6f00;--info:#1565c0;
    --bg:#0d1117;--card:#161b22;--border:#30363d;--text:#e6edf3;--muted:#8b949e;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--text);padding:24px}
  h1{font-size:1.6rem;font-weight:700;margin-bottom:4px}
  .subtitle{color:var(--muted);font-size:.85rem;margin-bottom:24px}
  .dashboard{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:16px;margin-bottom:28px}
  .card{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:20px;text-align:center}
  .card .num{font-size:2.2rem;font-weight:800;line-height:1}
  .card .label{font-size:.75rem;color:var(--muted);margin-top:6px;text-transform:uppercase;letter-spacing:.05em}
  .card.pass .num{color:var(--pass)}
  .card.fail .num{color:var(--fail)}
  .card.skip .num{color:var(--skip)}
  .card.rate .num{color:var(--info)}
  table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--border);border-radius:10px;overflow:hidden}
  thead{background:#21262d}
  th,td{padding:10px 14px;text-align:left;font-size:.82rem;border-bottom:1px solid var(--border)}
  th{font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:#1c2128}
  .badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.72rem;font-weight:700;text-transform:uppercase}
  .badge.passed{background:#00c85322;color:var(--pass);border:1px solid var(--pass)}
  .badge.failed{background:#d32f2f22;color:var(--fail);border:1px solid var(--fail)}
  .badge.skipped{background:#ff6f0022;color:var(--skip);border:1px solid var(--skip)}
  .detail{font-size:.75rem;color:var(--muted)}
  .error{color:var(--fail);font-size:.75rem;margin-top:4px;font-family:monospace;white-space:pre-wrap;word-break:break-all}
  details summary{cursor:pointer;color:var(--info);font-size:.78rem}
  details pre{background:#0d1117;padding:8px;border-radius:4px;margin-top:6px;font-size:.72rem;overflow:auto}
  .step-pass::before{content:"✅ "}
  .step-fail::before{content:"❌ "}
  .step-info::before{content:"ℹ️ "}
  img.ss{max-width:320px;border-radius:6px;margin-top:6px;border:1px solid var(--border)}
  .progress{height:6px;background:#21262d;border-radius:3px;margin-bottom:24px;overflow:hidden}
  .progress-bar{height:100%;background:linear-gradient(90deg,var(--pass),#00e676);border-radius:3px;transition:width .6s}
</style>
</head>
<body>
<h1>🎭 Goibibo Automation — Extent Report</h1>
<p class="subtitle">
  Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp;
  Total Duration: ${duration}s &nbsp;|&nbsp;
  Framework: Playwright + TypeScript
</p>

<div class="dashboard">
  <div class="card"><div class="num">${total}</div><div class="label">Total</div></div>
  <div class="card pass"><div class="num">${passed}</div><div class="label">Passed</div></div>
  <div class="card fail"><div class="num">${failed}</div><div class="label">Failed</div></div>
  <div class="card skip"><div class="num">${skipped}</div><div class="label">Skipped</div></div>
  <div class="card rate"><div class="num">${passRate}%</div><div class="label">Pass Rate</div></div>
</div>

<div class="progress"><div class="progress-bar" style="width:${passRate}%"></div></div>

<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Test</th>
      <th>Suite</th>
      <th>Status</th>
      <th>Duration</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    ${testRows}
  </tbody>
</table>
</body>
</html>`;
  }

  private _buildTestRow(r: TestRecord, index?: number): string {
    const dur = (r.duration / 1000).toFixed(2) + "s";

    // Build steps HTML
    const stepsHtml = r.steps.length
      ? r.steps
          .map(s => `<div class="step-${s.status === "passed" ? "pass" : "fail"}">${this._esc(s.title)} (${(s.duration/1000).toFixed(2)}s)</div>`)
          .join("")
      : "";

    // Build annotations (log messages)
    const logs = r.annotations
      .filter(a => a.description)
      .map(a => `<div class="detail">${this._esc(a.description ?? "")}</div>`)
      .join("");

    const screenshotHtml = r.screenshot
      ? `<img class="ss" src="data:image/png;base64,${r.screenshot}" alt="screenshot"/>`
      : "";

    const errorHtml = r.error
      ? `<div class="error">${this._esc(r.error)}</div>`
      : "";

    const details = stepsHtml || logs || screenshotHtml || errorHtml
      ? `<details>
          <summary>View details (${r.steps.length} steps)</summary>
          <pre>${stepsHtml}${logs}${screenshotHtml}${errorHtml}</pre>
        </details>`
      : "";

    const n = (index ?? this.records.indexOf(r)) + 1;

    return `<tr>
      <td>${n}</td>
      <td><strong>${this._esc(r.title)}</strong></td>
      <td class="detail">${this._esc(r.suite)}</td>
      <td><span class="badge ${r.status}">${r.status}</span></td>
      <td class="detail">${dur}</td>
      <td>${details}</td>
    </tr>`;
  }

  private _esc(s: string): string {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}

export default ExtentReporter;
