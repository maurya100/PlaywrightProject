/**
 * BasePage — Parent class for all Page Objects.
 *
 * Encapsulates common browser interactions so child pages stay
 * focused on their own element selectors and business logic.
 */
import { Page, Locator, expect } from "@playwright/test";
import { Logger } from "../utils/logger";

export abstract class BasePage {
  protected page: Page;
  protected log: Logger;

  constructor(page: Page) {
    this.page = page;
    this.log = new Logger(this.constructor.name);
  }

  // ── Navigation ───────────────────────────────────────────────────

  async navigateTo(url: string): Promise<void> {
    this.log.info(`Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("networkidle").catch(() => {
      // networkidle can be flaky on heavy SPAs — ignore timeout
    });
    this.log.info(`Page loaded: ${this.page.url()}`);
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  // ── Element interactions ─────────────────────────────────────────

  async clickElement(locator: Locator, description = ""): Promise<void> {
    this.log.info(`Click: ${description || locator.toString()}`);
    await locator.waitFor({ state: "visible", timeout: 15_000 });
    await locator.click();
  }

  async fillInput(locator: Locator, value: string, description = ""): Promise<void> {
    this.log.info(`Fill [${description || locator.toString()}]: "${value}"`);
    await locator.waitFor({ state: "visible", timeout: 15_000 });
    await locator.clear();
    await locator.fill(value);
  }

  async selectDropdown(locator: Locator, value: string): Promise<void> {
    this.log.info(`Select dropdown value: "${value}"`);
    await locator.selectOption(value);
  }

  async getText(locator: Locator): Promise<string> {
    await locator.waitFor({ state: "visible", timeout: 10_000 });
    return (await locator.innerText()).trim();
  }

  async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }

  // ── Waits ────────────────────────────────────────────────────────

  async waitForUrl(urlPattern: string | RegExp, timeout = 30_000): Promise<void> {
    this.log.info(`Waiting for URL matching: ${urlPattern}`);
    await this.page.waitForURL(urlPattern, { timeout });
  }

  async waitForElement(locator: Locator, timeout = 15_000): Promise<void> {
    await locator.waitFor({ state: "visible", timeout });
  }

  async waitMs(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  // ── Assertions ───────────────────────────────────────────────────

  async assertVisible(locator: Locator, description = ""): Promise<void> {
    this.log.info(`Assert visible: ${description}`);
    await expect(locator).toBeVisible({ timeout: 15_000 });
    this.log.pass(`✓ Visible: ${description}`);
  }

  async assertText(locator: Locator, expected: string): Promise<void> {
    this.log.info(`Assert text contains: "${expected}"`);
    await expect(locator).toContainText(expected, { timeout: 10_000 });
    this.log.pass(`✓ Text verified: "${expected}"`);
  }

  async assertUrl(expected: string | RegExp): Promise<void> {
    this.log.info(`Assert URL: ${expected}`);
    await expect(this.page).toHaveURL(expected, { timeout: 20_000 });
    this.log.pass(`✓ URL verified`);
  }

  // ── Scroll ───────────────────────────────────────────────────────

  async scrollToElement(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  async scrollToTop(): Promise<void> {
    await this.page.evaluate("window.scrollTo(0, 0)");
  }

  // ── Screenshots ──────────────────────────────────────────────────

  async takeScreenshot(name: string): Promise<Buffer> {
    this.log.info(`Screenshot: ${name}`);
    return this.page.screenshot({ fullPage: false });
  }

  // ── Popup / alert handling ───────────────────────────────────────

  async dismissAlert(): Promise<void> {
    this.page.on("dialog", (dialog) => dialog.dismiss());
  }

  async acceptAlert(): Promise<void> {
    this.page.on("dialog", (dialog) => dialog.accept());
  }

  // ── Keyboard ────────────────────────────────────────────────────

  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  async pressEnter(): Promise<void> {
    await this.pressKey("Enter");
  }

  async pressEscape(): Promise<void> {
    await this.pressKey("Escape");
  }

  async pressTab(): Promise<void> {
    await this.pressKey("Tab");
  }
}
