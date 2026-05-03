/**
 * Logger — lightweight wrapper that mirrors TestNG's Reporter.log().
 *
 * In Playwright the test runner captures stdout automatically, so
 * every console.log() call appears in the HTML report as a "step".
 * This class adds severity levels, timestamps, and pretty formatting.
 */
import { test } from "@playwright/test";

export enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
  PASS = "PASS",
  FAIL = "FAIL",
}

const ICONS: Record<LogLevel, string> = {
  [LogLevel.INFO]:  "ℹ️ ",
  [LogLevel.WARN]:  "⚠️ ",
  [LogLevel.ERROR]: "❌",
  [LogLevel.DEBUG]: "🔍",
  [LogLevel.PASS]:  "✅",
  [LogLevel.FAIL]:  "❌",
};

function timestamp(): string {
  return new Date().toISOString();
}

function format(level: LogLevel, message: string): string {
  return `[${timestamp()}] ${ICONS[level]} [${level}] ${message}`;
}

export class Logger {
  private context: string;

  constructor(context = "Test") {
    this.context = context;
  }

  info(message: string): void {
    const msg = format(LogLevel.INFO, `[${this.context}] ${message}`);
    console.log(msg);
    this.attachToReport(msg);
  }

  warn(message: string): void {
    const msg = format(LogLevel.WARN, `[${this.context}] ${message}`);
    console.warn(msg);
    this.attachToReport(msg);
  }

  error(message: string): void {
    const msg = format(LogLevel.ERROR, `[${this.context}] ${message}`);
    console.error(msg);
    this.attachToReport(msg);
  }

  debug(message: string): void {
    if (process.env.DEBUG) {
      const msg = format(LogLevel.DEBUG, `[${this.context}] ${message}`);
      console.log(msg);
    }
  }

  pass(message: string): void {
    const msg = format(LogLevel.PASS, `[${this.context}] ${message}`);
    console.log(msg);
    this.attachToReport(msg);
  }

  fail(message: string): void {
    const msg = format(LogLevel.FAIL, `[${this.context}] ${message}`);
    console.error(msg);
    this.attachToReport(msg);
  }

  /**
   * Attach a message to the Playwright HTML report as a named annotation.
   * This mirrors TestNG's Reporter.log() behaviour.
   */
  private attachToReport(message: string): void {
    try {
      test.info().annotations.push({ type: "log", description: message });
    } catch {
      // test.info() may not be available outside a test – silently ignore
    }
  }

  /** Log a data table (key-value pairs) — useful for Excel row data. */
  table(label: string, data: Record<string, unknown>): void {
    this.info(`── ${label} ──`);
    for (const [k, v] of Object.entries(data)) {
      this.info(`   ${k}: ${v}`);
    }
  }
}

/** Singleton logger for quick use in page objects. */
export const log = new Logger("Framework");
