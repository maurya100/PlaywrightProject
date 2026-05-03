/**
 * BookingPage — Page Object for the hotel booking / checkout page.
 *
 * URL pattern: goibibo.com/hotels/book/ ...
 *
 * Responsibilities:
 *  • Verify booking summary (hotel name, dates, room)
 *  • Fill guest details
 *  • Enter payment (credit card) details
 *  • Observe and return error messages
 */
import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class BookingPage extends BasePage {
  // ── Booking summary ──────────────────────────────────────────────
  readonly bookingHotelName: Locator;
  readonly checkInDisplay: Locator;
  readonly checkOutDisplay: Locator;
  readonly roomType: Locator;

  // ── Guest details form ───────────────────────────────────────────
  readonly salutationDropdown: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly specialRequestInput: Locator;
  readonly payButton: Locator;

  // ── Payment form ─────────────────────────────────────────────────
  readonly cardNumberInput: Locator;
  readonly cardNameInput: Locator;
  readonly cardExpiryInput: Locator;
  readonly cardCvvInput: Locator;
  readonly payNowButton: Locator;

  // ── Error messages ───────────────────────────────────────────────
  readonly paymentErrorMessage: Locator;
  readonly genericErrorMessage: Locator;

  constructor(page: Page) {
    super(page);

    // Booking summary
    this.bookingHotelName = page.locator(
      '.hotelName, .bookingHotelName, h2.htl-name, [data-cy="booking-hotel-name"]'
    ).first();

    this.checkInDisplay = page.locator(
      '.checkInDate, [data-cy="checkin-display"], .checkIn'
    ).first();

    this.checkOutDisplay = page.locator(
      '.checkOutDate, [data-cy="checkout-display"], .checkOut'
    ).first();

    this.roomType = page.locator(
      '.roomName, .roomType, [data-cy="room-type"]'
    ).first();

    // Guest form
    this.salutationDropdown = page.locator(
      'select[name*="salutation"], select.salutation'
    ).first();

    this.firstNameInput = page.locator(
      'input[name*="firstName"], input[placeholder*="First Name"], #firstName'
    ).first();

    this.lastNameInput = page.locator(
      'input[name*="lastName"], input[placeholder*="Last Name"], #lastName'
    ).first();

    this.emailInput = page.locator(
      'input[type="email"], input[name*="email"], input[placeholder*="Email"]'
    ).first();

    this.phoneInput = page.locator(
      'input[type="tel"], input[name*="phone"], input[placeholder*="Mobile"]'
    ).first();

    this.specialRequestInput = page.locator(
      'textarea[name*="special"], textarea[placeholder*="special"], textarea'
    ).first();

    this.payButton = page.locator(
      'button:has-text("Pay"), button:has-text("Proceed"), a:has-text("Pay Rs")'
    ).first();

    // Payment form
    this.cardNumberInput = page.locator(
      'input[name*="cardNumber"], input[placeholder*="Card Number"], #cardNumber'
    ).first();

    this.cardNameInput = page.locator(
      'input[name*="nameOnCard"], input[placeholder*="Name on Card"], #nameOnCard'
    ).first();

    this.cardExpiryInput = page.locator(
      'input[name*="expiry"], input[placeholder*="MM/YY"], #expiry'
    ).first();

    this.cardCvvInput = page.locator(
      'input[name*="cvv"], input[name*="CVV"], input[placeholder*="CVV"], #cvv'
    ).first();

    this.payNowButton = page.locator(
      'button:has-text("Pay ₹"), button:has-text("Pay Now"), button[type="submit"]:has-text("Pay")'
    ).first();

    // Errors
    this.paymentErrorMessage = page.locator(
      '.paymentError, .error-message, [class*="error"]:visible, .alert-danger'
    ).first();

    this.genericErrorMessage = page.locator(
      '.errorMsg, .error, [role="alert"], .notification-error'
    ).first();
  }

  // ── Booking summary ──────────────────────────────────────────────

  async getBookingHotelName(): Promise<string> {
    await this.bookingHotelName.waitFor({ state: "visible", timeout: 15_000 });
    const name = await this.bookingHotelName.innerText();
    this.log.info(`Booking page hotel: ${name.trim()}`);
    return name.trim();
  }

  async verifyBookingDetails(expectedHotelName: string): Promise<void> {
    this.log.info("=== Verifying Booking Details ===");
    const name = await this.getBookingHotelName();
    this.log.info(`Hotel: ${name}`);

    const checkIn  = await this.checkInDisplay.innerText().catch(() => "N/A");
    const checkOut = await this.checkOutDisplay.innerText().catch(() => "N/A");
    const room     = await this.roomType.innerText().catch(() => "N/A");

    this.log.info(`Check-in: ${checkIn.trim()}`);
    this.log.info(`Check-out: ${checkOut.trim()}`);
    this.log.info(`Room: ${room.trim()}`);

    if (name.includes(expectedHotelName)) {
      this.log.pass(`Booking hotel name matches: "${name}"`);
    } else {
      this.log.warn(`Expected "${expectedHotelName}", got "${name}"`);
    }
  }

  // ── Guest details ────────────────────────────────────────────────

  async fillGuestDetails(details: {
    salutation?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    specialRequest?: string;
  }): Promise<void> {
    this.log.info("=== Filling Guest Details ===");

    if (details.salutation) {
      await this.salutationDropdown.selectOption(details.salutation).catch(() =>
        this.log.warn("Salutation dropdown not found — skipping")
      );
    }

    await this.fillInput(this.firstNameInput, details.firstName, "First Name");
    await this.fillInput(this.lastNameInput,  details.lastName,  "Last Name");
    await this.fillInput(this.emailInput,     details.email,     "Email");
    await this.fillInput(this.phoneInput,     details.phone,     "Phone");

    if (details.specialRequest) {
      await this.specialRequestInput
        .fill(details.specialRequest)
        .catch(() => this.log.warn("Special request field not found — skipping"));
    }

    this.log.pass("Guest details filled");
  }

  async clickPayButton(): Promise<void> {
    this.log.info("Clicking Pay button");
    await this.clickElement(this.payButton, "Pay button");
    await this.waitMs(2000);
  }

  // ── Payment form ─────────────────────────────────────────────────

  async fillCardDetails(card: {
    number: string;
    name: string;
    expiry: string;
    cvv: string;
  }): Promise<void> {
    this.log.info("=== Filling Dummy Card Details ===");
    await this.fillInput(this.cardNumberInput, card.number, "Card Number");
    await this.fillInput(this.cardNameInput,   card.name,   "Name on Card");
    await this.fillInput(this.cardExpiryInput, card.expiry, "Expiry");
    await this.fillInput(this.cardCvvInput,    card.cvv,    "CVV");
    this.log.info("Card details entered (dummy values)");
  }

  async clickPayNow(): Promise<void> {
    this.log.info("Clicking 'Pay Now'");
    await this.payNowButton.click();
    await this.waitMs(3000);
  }

  // ── Error observation ────────────────────────────────────────────

  async getPaymentErrorMessage(): Promise<string> {
    await this.waitMs(2000);
    let errorText = "";

    // Try primary selector
    if (await this.paymentErrorMessage.isVisible().catch(() => false)) {
      errorText = await this.paymentErrorMessage.innerText();
    }
    // Fallback: any visible element with "error" class
    else {
      const errors = this.page.locator('[class*="error"]:visible, [class*="Error"]:visible');
      const count  = await errors.count();
      for (let i = 0; i < count; i++) {
        const text = await errors.nth(i).innerText().catch(() => "");
        if (text.trim()) { errorText = text; break; }
      }
    }

    this.log.info(`Error message observed: "${errorText.trim()}"`);
    return errorText.trim();
  }

  async waitForErrorAndLog(): Promise<string> {
    const error = await this.getPaymentErrorMessage();
    if (error) {
      this.log.pass(`✓ Error message captured: "${error}"`);
    } else {
      this.log.warn("No error message found within timeout");
    }
    return error;
  }
}
