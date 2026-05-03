/**
 * HotelListPage — Page Object for the hotel search results page.
 *
 * URL pattern: goibibo.com/hotels/find-hotels-in-*
 *
 * Responsibilities:
 *  • Read hotel names and total count
 *  • Apply filters (pay at hotel, rating, price range)
 *  • Click a specific hotel card
 */
import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class HotelListPage extends BasePage {
  // ── Locators ─────────────────────────────────────────────────────
  readonly hotelCards: Locator;
  readonly hotelNames: Locator;
  readonly hotelCountText: Locator;
  readonly payAtHotelFilter: Locator;
  readonly ratingFilters: Locator;
  readonly priceRangeFilters: Locator;
  readonly loadingSpinner: Locator;
  readonly firstHotelBookNow: Locator;

  constructor(page: Page) {
    super(page);

    // Hotel cards in the list
    this.hotelCards = page.locator(
      '.hotel-tile, .hotelCard, [data-cy="hotel-card"], .htl-card'
    );

    // Hotel name elements
    this.hotelNames = page.locator(
      '.hotel-tile .htl-name, .hotelCard .hotelName, .hotelCardName, .htl-name'
    );

    // Total count (e.g. "Showing 120 hotels")
    this.hotelCountText = page.locator(
      '.noOfHotels, .totalCount, h2:has-text("hotel"), span:has-text("Results")'
    ).first();

    // Filters
    this.payAtHotelFilter = page.locator(
      'label:has-text("Pay At Hotel"), input[value="PAY_AT_HOTEL"] + label'
    ).first();

    this.ratingFilters = page.locator(
      '.userRating label, .ratingFilter label, input[name*="rating"] + label'
    );

    this.priceRangeFilters = page.locator(
      '.priceRange label, .priceFilter label, input[name*="price"] + label'
    );

    this.loadingSpinner = page.locator('.loader, .loading, [class*="spinner"]');

    this.firstHotelBookNow = page.locator(
      '.hotel-tile:first-child .bookNowBtn, .hotelCard:first-child button:has-text("Book Now")'
    ).first();
  }

  // ── Helpers ──────────────────────────────────────────────────────

  /** Wait for hotel cards to appear after a search. */
  async waitForResults(): Promise<void> {
    this.log.info("Waiting for hotel results to load...");
    await this.page.waitForLoadState("domcontentloaded");

    // Wait for spinner to disappear
    await this.loadingSpinner.waitFor({ state: "hidden", timeout: 20_000 }).catch(() => {});

    // Wait for at least one hotel card
    await this.hotelCards.first().waitFor({ state: "visible", timeout: 20_000 });
    this.log.info("Hotel results loaded");
  }

  // ── Data extraction ──────────────────────────────────────────────

  /** Return the text of the first hotel name. */
  async getFirstHotelName(): Promise<string> {
    await this.waitForResults();
    const name = await this.hotelNames.first().innerText();
    this.log.pass(`First hotel name: ${name.trim()}`);
    return name.trim();
  }

  /** Return all visible hotel names on the current page. */
  async getAllHotelNames(): Promise<string[]> {
    await this.waitForResults();
    const count = await this.hotelNames.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const name = await this.hotelNames.nth(i).innerText();
      names.push(name.trim());
    }
    this.log.info(`Found ${names.length} hotel names on page`);
    return names;
  }

  /** Extract the numeric hotel count from the results header. */
  async getTotalHotelCount(): Promise<number> {
    try {
      await this.hotelCountText.waitFor({ state: "visible", timeout: 10_000 });
      const text = await this.hotelCountText.innerText();
      const match = text.match(/\d+/);
      const count = match ? parseInt(match[0], 10) : 0;
      this.log.info(`Total hotel count: ${count}`);
      return count;
    } catch {
      this.log.warn("Could not read hotel count — returning 0");
      return 0;
    }
  }

  // ── Filters ──────────────────────────────────────────────────────

  async applyPayAtHotelFilter(): Promise<void> {
    this.log.info("Applying 'Pay At Hotel' filter");
    await this.scrollToElement(this.payAtHotelFilter);
    await this.payAtHotelFilter.click();
    await this.waitForResults();
    this.log.pass("'Pay At Hotel' filter applied");
  }

  async applyRatingFilter(rating: string): Promise<void> {
    this.log.info(`Applying rating filter: ${rating}`);
    const ratingLabel = this.page.locator(
      `label:has-text("${rating}"), input[value="${rating}"] + label, .ratingFilter label:has-text("${rating}")`
    ).first();
    await this.scrollToElement(ratingLabel);
    await ratingLabel.click();
    await this.waitForResults();
    this.log.pass(`Rating filter '${rating}' applied`);
  }

  async applyPriceRangeFilter(index = 0): Promise<void> {
    this.log.info(`Applying price range filter at index: ${index}`);
    const priceFilter = this.priceRangeFilters.nth(index);
    await this.scrollToElement(priceFilter);
    await priceFilter.click();
    await this.waitForResults();
    this.log.pass(`Price range filter #${index + 1} applied`);
  }

  // ── Verification ─────────────────────────────────────────────────

  async verifyPayAtHotelFilterApplied(): Promise<boolean> {
    const activeFilter = this.page.locator(
      '.activeFilters:has-text("Pay At Hotel"), .appliedFilter:has-text("Pay At Hotel")'
    ).first();
    const visible = await activeFilter.isVisible().catch(() => false);
    if (visible) {
      this.log.pass("'Pay At Hotel' filter is active ✓");
    } else {
      this.log.warn("'Pay At Hotel' filter badge not found — checking checkbox state");
    }
    return visible;
  }

  async verifyRatingFilterApplied(rating: string): Promise<boolean> {
    const checked = await this.page
      .locator(`input[value="${rating}"]:checked, label:has-text("${rating}").active`)
      .count();
    const applied = checked > 0;
    if (applied) {
      this.log.pass(`Rating filter '${rating}' is active ✓`);
    } else {
      this.log.warn(`Rating filter '${rating}' checkbox not checked`);
    }
    return applied;
  }

  async verifyPriceRangeFilterApplied(index: number): Promise<boolean> {
    const checked = await this.priceRangeFilters.nth(index).locator("input").isChecked();
    if (checked) {
      this.log.pass(`Price range filter #${index + 1} is active ✓`);
    } else {
      this.log.warn(`Price range filter #${index + 1} not checked`);
    }
    return checked;
  }

  // ── Navigation ───────────────────────────────────────────────────

  /** Click a hotel by its name. Returns the hotel name for assertion. */
  async clickHotelByName(hotelName: string): Promise<void> {
    this.log.info(`Clicking hotel: ${hotelName}`);
    const hotelLink = this.page
      .locator(`.htl-name:has-text("${hotelName}"), .hotelName:has-text("${hotelName}")`)
      .first();
    await this.scrollToElement(hotelLink);
    await hotelLink.click();
    await this.page.waitForLoadState("domcontentloaded");
    this.log.info("Navigated to hotel detail page");
  }

  /** Click the first hotel in the list. Returns its name. */
  async clickFirstHotel(): Promise<string> {
    const name = await this.getFirstHotelName();
    this.log.info(`Clicking first hotel: ${name}`);
    await this.hotelNames.first().click();
    await this.page.waitForLoadState("domcontentloaded");
    return name;
  }
}
