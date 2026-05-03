/**
 * Central configuration object consumed by all tests & utilities.
 * All values fall back to sensible defaults so the suite works
 * even without a .env file.
 */
export const TestConfig = {
  baseUrl: process.env.BASE_URL ?? "https://www.goibibo.com",
  headless: process.env.HEADLESS !== "false",
  excelFilePath: process.env.EXCEL_FILE_PATH ?? "./test-data/TestData.xlsx",
  reportDir: process.env.REPORT_DIR ?? "./reports",

  // ── Search parameters ───────────────────────────────────────────
  search: {
    location: "Ooty",
    checkInOffsetDays: 7,   // check-in = today + 7 days
    checkOutOffsetDays: 9,  // check-out = today + 9 days (2 nights)
    adults: 1,
    rooms: 1,
  },

  // ── Guest details (Scenario 2) ──────────────────────────────────
  guest: {
    salutation: "Mr",
    firstName: process.env.GUEST_FIRST_NAME ?? "Ram",
    lastName: process.env.GUEST_LAST_NAME ?? "Kumar",
    email: process.env.GUEST_EMAIL ?? "ram.dummy@gmail.com",
    phone: process.env.GUEST_PHONE ?? "9090909090",
    specialRequest: process.env.GUEST_SPECIAL_REQUEST ?? "veg only",
  },

  // ── Dummy payment details ───────────────────────────────────────
  card: {
    number: process.env.CARD_NUMBER ?? "4111111111111111",
    name: process.env.CARD_NAME ?? "Ram Kumar",
    expiry: process.env.CARD_EXPIRY ?? "12/26",
    cvv: process.env.CARD_CVV ?? "123",
  },

  // ── Filters (Scenario 4) ────────────────────────────────────────
  filters: {
    payAtHotel: true,
    rating: "4",
    priceRangeIndex: 0, // first price-range checkbox
  },

  // ── Timeouts (ms) ──────────────────────────────────────────────
  timeouts: {
    short: 5_000,
    medium: 15_000,
    long: 30_000,
    navigation: 45_000,
  },
} as const;

// ── Date helpers ────────────────────────────────────────────────────
export function getFutureDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  // Returns "DD Mon YYYY" e.g. "15 Jun 2025"
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getFormattedDate(offsetDays: number): {
  day: string;
  month: string;
  year: string;
  full: string;
} {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: String(d.getMonth() + 1).padStart(2, "0"),
    year: String(d.getFullYear()),
    full: d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };
}
