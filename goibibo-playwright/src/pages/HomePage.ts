/**
 * HomePage — Page Object for https://www.goibibo.com/
 *
 * Responsibilities:
 *  • Navigate to the site
 *  • Click the Hotels menu tab
 *  • Fill the hotel search form (location, dates, guests)
 *  • Click "Get Set Go"
 */
import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";
import { GoibiboDate } from "../utils/dateHelper";

export class HomePage extends BasePage {
  // ── Locators ─────────────────────────────────────────────────────
  readonly hotelsMenuTab: Locator;
  readonly locationInput: Locator;
  readonly locationSuggestions: Locator;
  readonly checkInDate: Locator;
  readonly checkOutDate: Locator;
  readonly roomsGuestsDropdown: Locator;
  readonly getSetGoButton: Locator;
  readonly doneButton: Locator;
  readonly adultIncreaseBtn: Locator;
  readonly adultDecreaseBtn: Locator;
  readonly adultCount: Locator;

  constructor(page: Page) {
    super(page);

    // Navigation tabs
    this.hotelsMenuTab = page.locator('a[href*="hotels"], li a:has-text("Hotels")').first();

    // Search form
    this.locationInput = page.locator(
      'input[placeholder*="city"], input[placeholder*="hotel"], input[placeholder*="location"], #Hotels-source-element'
    ).first();

    this.locationSuggestions = page.locator(
      '.locationAutoSuggestionMenu li, .autoSuggestList li, ul.autoSuggest li'
    );

    this.checkInDate = page.locator(
      '.checkIn, [data-cy="checkin"], input[placeholder*="Check-in"], .dateBox:first-child'
    ).first();

    this.checkOutDate = page.locator(
      '.checkOut, [data-cy="checkout"], input[placeholder*="Check-out"], .dateBox:last-child'
    ).first();

    this.roomsGuestsDropdown = page.locator(
      '.roomGuest, [data-cy="rooms-guests"], .guestCount, button:has-text("Guest"), .roomGuestContainer'
    ).first();

    this.getSetGoButton = page.locator(
      'button:has-text("Get Set Go"), a:has-text("Get Set Go"), .searchButton'
    ).first();

    this.doneButton = page.locator('button:has-text("Done"), .applyBtn').first();

    this.adultIncreaseBtn = page.locator(
      '.adultContainer button.increamentBtn, .guestBox .increamentBtn'
    ).first();

    this.adultDecreaseBtn = page.locator(
      '.adultContainer button.decreamentBtn, .guestBox .decreamentBtn'
    ).first();

    this.adultCount = page.locator('.adultCount, .adultContainer .count').first();
  }

  // ── Actions ──────────────────────────────────────────────────────

  async open(): Promise<void> {
    await this.navigateTo("https://www.goibibo.com");
    this.log.info("Home page opened");
  }

  async clickHotelsMenu(): Promise<void> {
    await this.clickElement(this.hotelsMenuTab, "Hotels menu tab");
    await this.page.waitForLoadState("domcontentloaded");
    this.log.info("Navigated to Hotels section");
  }

  async enterLocation(location: string): Promise<void> {
    await this.clickElement(this.locationInput, "Location input");
    await this.fillInput(this.locationInput, location, "Location");
    await this.waitMs(1500);

    // Click the first suggestion that matches
    const suggestion = this.locationSuggestions.first();
    await suggestion.waitFor({ state: "visible", timeout: 10_000 });
    await suggestion.click();
    this.log.info(`Location selected: ${location}`);
  }

  async selectCheckInDate(date: GoibiboDate): Promise<void> {
    await this.clickElement(this.checkInDate, "Check-in date");
    await this._selectDateFromCalendar(date);
    this.log.info(`Check-in date selected: ${date.formatted}`);
  }

  async selectCheckOutDate(date: GoibiboDate): Promise<void> {
    await this.clickElement(this.checkOutDate, "Check-out date");
    await this._selectDateFromCalendar(date);
    this.log.info(`Check-out date selected: ${date.formatted}`);
  }

  /** Generic calendar date picker — clicks the day cell for the given date. */
  private async _selectDateFromCalendar(date: GoibiboDate): Promise<void> {
    // Try to find and click the day cell directly
    // Goibibo renders dates as aria-label or data-* attributes
    const dayCell = this.page.locator(
      `[aria-label*="${date.day}"][aria-label*="${date.monthFull}"],
       td[data-date="${date.iso}"],
       .DayPicker-Day[aria-label*="${date.monthShort} ${date.day}"]`
    ).first();

    // Navigate months if needed
    let attempts = 0;
    while (!(await dayCell.isVisible()) && attempts < 6) {
      const nextMonthBtn = this.page.locator(
        '.nextMonth, .DayPicker-NavButton--next, button[aria-label="Next Month"]'
      ).first();
      if (await nextMonthBtn.isVisible()) {
        await nextMonthBtn.click();
        await this.waitMs(500);
      }
      attempts++;
    }

    if (await dayCell.isVisible()) {
      await dayCell.click();
    } else {
      // Fallback: click the day number text
      const fallback = this.page.locator(
        `.DayPicker-Day:not(.DayPicker-Day--outside):has-text("${date.day}")`
      ).first();
      await fallback.click();
    }
  }

  async setAdults(count: number): Promise<void> {
    await this.clickElement(this.roomsGuestsDropdown, "Rooms & Guests dropdown");
    await this.waitMs(500);

    // Reset to 1 adult first (default), then increment/decrement
    const currentText = await this.adultCount.textContent().catch(() => "1");
    const current = parseInt(currentText?.trim() ?? "1", 10);

    if (count > current) {
      for (let i = 0; i < count - current; i++) {
        await this.adultIncreaseBtn.click();
        await this.waitMs(200);
      }
    } else if (count < current) {
      for (let i = 0; i < current - count; i++) {
        await this.adultDecreaseBtn.click();
        await this.waitMs(200);
      }
    }

    await this.clickElement(this.doneButton, "Done button");
    this.log.info(`Adults set to: ${count}`);
  }

  async clickGetSetGo(): Promise<void> {
    await this.clickElement(this.getSetGoButton, "Get Set Go button");
    await this.page.waitForLoadState("domcontentloaded");
    this.log.info("Search submitted — navigating to results");
  }

  /** Full search flow in one call. */
  async searchHotel(params: {
    location: string;
    checkIn: GoibiboDate;
    checkOut: GoibiboDate;
    adults: number;
  }): Promise<void> {
    this.log.info("=== Starting Hotel Search ===");
    await this.clickHotelsMenu();
    await this.enterLocation(params.location);
    await this.selectCheckInDate(params.checkIn);
    await this.selectCheckOutDate(params.checkOut);
    await this.setAdults(params.adults);
    await this.clickGetSetGo();
    this.log.info("=== Hotel Search Submitted ===");
  }
}
