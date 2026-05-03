/**
 * HotelDetailPage — Page Object for the individual hotel page.
 *
 * Responsibilities:
 *  • Verify hotel name
 *  • Navigate tabs: Rooms & Rates, Location, Guest Reviews,
 *    Questions & Answers, Hotel Policies
 *  • Click "Book Now"
 *  • Log room images
 */
import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class HotelDetailPage extends BasePage {
  // ── Locators ─────────────────────────────────────────────────────
  readonly hotelName: Locator;
  readonly bookNowButton: Locator;

  // Tab menu items
  readonly roomsRatesTab: Locator;
  readonly locationTab: Locator;
  readonly guestReviewsTab: Locator;
  readonly questionsAnswersTab: Locator;
  readonly hotelPoliciesTab: Locator;

  // Tab sections
  readonly roomsRatesSection: Locator;
  readonly locationSection: Locator;
  readonly guestReviewsSection: Locator;
  readonly questionsAnswersSection: Locator;
  readonly hotelPoliciesSection: Locator;

  // Room images
  readonly roomImages: Locator;

  constructor(page: Page) {
    super(page);

    this.hotelName = page.locator(
      'h1.htl-name, h1.hotelName, .hotel-name h1, [itemprop="name"]'
    ).first();

    this.bookNowButton = page.locator(
      'button:has-text("Book Now"), a:has-text("Book Now")'
    ).first();

    // Tabs
    this.roomsRatesTab        = page.locator('a:has-text("Room & Rates"), a:has-text("Rooms & Rates")').first();
    this.locationTab           = page.locator('a:has-text("Location")').first();
    this.guestReviewsTab       = page.locator('a:has-text("Guest Reviews")').first();
    this.questionsAnswersTab   = page.locator('a:has-text("Question"), a:has-text("Q&A")').first();
    this.hotelPoliciesTab      = page.locator('a:has-text("Hotel Policies"), a:has-text("Policies")').first();

    // Sections
    this.roomsRatesSection      = page.locator('#room_and_rates, .roomsRatesContainer, section:has(h2:has-text("Room"))').first();
    this.locationSection        = page.locator('#location, .locationContainer, section:has(h2:has-text("Location"))').first();
    this.guestReviewsSection    = page.locator('#guest_reviews, .reviewsContainer, section:has(h2:has-text("Review"))').first();
    this.questionsAnswersSection = page.locator('#qa_section, .qaContainer, section:has(h2:has-text("Question"))').first();
    this.hotelPoliciesSection   = page.locator('#hotel_policies, .policiesContainer, section:has(h2:has-text("Polic"))').first();

    // Room images
    this.roomImages = page.locator(
      '#room_and_rates img, .roomCard img, .roomImages img'
    );
  }

  // ── Getters ──────────────────────────────────────────────────────

  async getHotelName(): Promise<string> {
    await this.hotelName.waitFor({ state: "visible", timeout: 15_000 });
    const name = await this.hotelName.innerText();
    this.log.pass(`Hotel detail page name: ${name.trim()}`);
    return name.trim();
  }

  // ── Tab navigation ───────────────────────────────────────────────

  async clickRoomsRatesTab(): Promise<void> {
    this.log.info("Clicking 'Room & Rates' tab");
    await this.scrollToElement(this.roomsRatesTab);
    await this.roomsRatesTab.click();
    await this.waitMs(1000);
  }

  async clickLocationTab(): Promise<void> {
    this.log.info("Clicking 'Location' tab");
    await this.scrollToElement(this.locationTab);
    await this.locationTab.click();
    await this.waitMs(1000);
  }

  async clickGuestReviewsTab(): Promise<void> {
    this.log.info("Clicking 'Guest Reviews' tab");
    await this.scrollToElement(this.guestReviewsTab);
    await this.guestReviewsTab.click();
    await this.waitMs(1000);
  }

  async clickQuestionsAnswersTab(): Promise<void> {
    this.log.info("Clicking 'Questions & Answers' tab");
    await this.scrollToElement(this.questionsAnswersTab);
    await this.questionsAnswersTab.click();
    await this.waitMs(1000);
  }

  async clickHotelPoliciesTab(): Promise<void> {
    this.log.info("Clicking 'Hotel Policies' tab");
    await this.scrollToElement(this.hotelPoliciesTab);
    await this.hotelPoliciesTab.click();
    await this.waitMs(1000);
  }

  // ── Section visibility verification ──────────────────────────────

  async isRoomsRatesSectionVisible(): Promise<boolean> {
    const visible = await this.roomsRatesSection.isVisible().catch(() => false);
    this.log[visible ? "pass" : "warn"](`Rooms & Rates section visible: ${visible}`);
    return visible;
  }

  async isLocationSectionVisible(): Promise<boolean> {
    const visible = await this.locationSection.isVisible().catch(() => false);
    this.log[visible ? "pass" : "warn"](`Location section visible: ${visible}`);
    return visible;
  }

  async isGuestReviewsSectionVisible(): Promise<boolean> {
    const visible = await this.guestReviewsSection.isVisible().catch(() => false);
    this.log[visible ? "pass" : "warn"](`Guest Reviews section visible: ${visible}`);
    return visible;
  }

  async isQuestionsAnswersSectionVisible(): Promise<boolean> {
    const visible = await this.questionsAnswersSection.isVisible().catch(() => false);
    this.log[visible ? "pass" : "warn"](`Q&A section visible: ${visible}`);
    return visible;
  }

  async isHotelPoliciesSectionVisible(): Promise<boolean> {
    const visible = await this.hotelPoliciesSection.isVisible().catch(() => false);
    this.log[visible ? "pass" : "warn"](`Hotel Policies section visible: ${visible}`);
    return visible;
  }

  // ── Room images ──────────────────────────────────────────────────

  async getFirstRoomImageSrc(): Promise<string> {
    await this.clickRoomsRatesTab();
    const img = this.roomImages.first();
    await img.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
    const src = await img.getAttribute("src") ?? "";
    this.log.info(`First room image src: ${src}`);
    return src;
  }

  async getRoomImageCount(): Promise<number> {
    await this.clickRoomsRatesTab();
    const count = await this.roomImages.count();
    this.log.info(`Room images found: ${count}`);
    return count;
  }

  // ── Booking ──────────────────────────────────────────────────────

  async clickBookNow(): Promise<void> {
    this.log.info("Clicking 'Book Now'");
    await this.scrollToElement(this.bookNowButton);
    await this.bookNowButton.click();
    await this.page.waitForLoadState("domcontentloaded");
    this.log.info("Navigated to booking page");
  }

  // ── Name verification ─────────────────────────────────────────────

  async verifyHotelName(expectedName: string): Promise<void> {
    this.log.info(`Verifying hotel name matches: "${expectedName}"`);
    const actualName = await this.getHotelName();
    expect(actualName).toContain(expectedName);
    this.log.pass(`Hotel name verified ✓: "${actualName}"`);
  }
}
