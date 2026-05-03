/**
 * ReportHelper — Extent-Reports-style helper built on top of
 * Playwright's built-in attach / annotation API.
 *
 * Since Playwright ships a powerful HTML reporter out of the box,
 * this helper enriches it with:
 *   • named step annotations  (like ExtentTest.info / pass / fail)
 *   • screenshot attachments
 *   • JSON data attachments
 *
 * All methods are async and accept a Playwright `Page` and `TestInfo`.
 */
import { Page, TestInfo } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

export type StepStatus = "pass" | "fail" | "info" | "warn" | "skip";

const STATUS_ICON: Record<StepStatus, string> = {
  pass: "✅",
  fail: "❌",
  info: "ℹ️",
  warn: "⚠️",
  skip: "⏭️",
};

export class ReportHelper {
  constructor(private page: Page, private testInfo: TestInfo) {}

  // ── Step logging ─────────────────────────────────────────────────

  /** Log a step with status — mirrors ExtentTest.log(Status, ...) */
  log(status: StepStatus, message: string): void {
    const formatted = `${STATUS_ICON[status]} ${message}`;
    this.testInfo.annotations.push({
      type: `step:${status}`,
      description: formatted,
    });
    console.log(`[${status.toUpperCase()}] ${message}`);
  }

  info(message: string): void  { this.log("info",  message); }
  pass(message: string): void  { this.log("pass",  message); }
  fail(message: string): void  { this.log("fail",  message); }
  warn(message: string): void  { this.log("warn",  message); }
  skip(message: string): void  { this.log("skip",  message); }

  // ── Screenshots ──────────────────────────────────────────────────

  /** Capture a screenshot and attach it to the report. */
  async screenshot(name: string): Promise<void> {
    const buffer = await this.page.screenshot({ fullPage: false });
    await this.testInfo.attach(name, {
      body: buffer,
      contentType: "image/png",
    });
    this.info(`Screenshot captured: ${name}`);
  }

  /** Capture a full-page screenshot. */
  async fullPageScreenshot(name: string): Promise<void> {
    const buffer = await this.page.screenshot({ fullPage: true });
    await this.testInfo.attach(`${name} (full page)`, {
      body: buffer,
      contentType: "image/png",
    });
    this.info(`Full-page screenshot captured: ${name}`);
  }

  // ── Data attachments ─────────────────────────────────────────────

  /** Attach a JSON object as a named attachment — useful for API responses / Excel rows. */
  async attachJson(name: string, data: unknown): Promise<void> {
    await this.testInfo.attach(name, {
      body: JSON.stringify(data, null, 2),
      contentType: "application/json",
    });
  }

  /** Attach arbitrary text (e.g. hotel name list). */
  async attachText(name: string, text: string): Promise<void> {
    await this.testInfo.attach(name, {
      body: text,
      contentType: "text/plain",
    });
  }

  // ── Extent-style test markers ────────────────────────────────────

  /** Mark the test as a known failure with a reason. */
  markKnownIssue(reason: string): void {
    this.testInfo.annotations.push({ type: "known-issue", description: reason });
    this.warn(`Known issue: ${reason}`);
  }

  /** Add test metadata (mirrors @Epic / @Feature / @Story in Allure). */
  addMetadata(key: string, value: string): void {
    this.testInfo.annotations.push({ type: key, description: value });
  }

  // ── Convenience helpers ──────────────────────────────────────────

  /**
   * Log hotel information to the report — mirrors TestNG Reporter.log().
   * Called from every hotel search scenario.
   */
  async logHotelInfo(hotelName: string, index?: number): Promise<void> {
    const label = index !== undefined ? `Hotel #${index + 1}` : "First Hotel";
    this.pass(`${label}: ${hotelName}`);
    await this.attachText("Hotel Name", hotelName);
    await this.screenshot(`${label} - ${hotelName}`);
  }

  /**
   * Log a hotel list to the report with total count — Scenario 1.
   */
  async logHotelList(hotels: string[], totalCount: number): Promise<void> {
    this.info(`Total hotels found: ${totalCount}`);
    const list = hotels.map((h, i) => `${i + 1}. ${h}`).join("\n");
    await this.attachText("Hotel List", `Total: ${totalCount}\n\n${list}`);
    this.pass(`Hotel list logged successfully (${hotels.length} displayed)`);
  }

  /** Log key-value table — mirrors TestNG Reporter.log() for data display. */
  table(label: string, data: Record<string, unknown>): void {
    this.info(`── ${label} ──`);
    for (const [k, v] of Object.entries(data)) {
      this.info(`   ${k.padEnd(26)} : ${v}`);
    }
  }
}
