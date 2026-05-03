/**
 * Scenario 2 — Book a hotel stay for one adult in Ooty (stay > 1 day).
 * Fill dummy card details and observe the error message.
 *
 * Steps:
 *  1. Open goibibo.com
 *  2. Click Hotels → search Ooty (check-out = check-in + 2 nights)
 *  3. Log hotel name and count
 *  4. Verify hotel title → click it
 *  5. On detail page: verify name → click "Book Now"
 *  6. Verify booking details
 *  7. Fill guest details → click Pay
 *  8. Enter dummy card → click Pay Now
 *  9. Observe & assert the error message
 */
import { test, expect } from "@playwright/test";
import { HomePage }       from "../pages/HomePage";
import { HotelListPage }  from "../pages/HotelListPage";
import { HotelDetailPage} from "../pages/HotelDetailPage";
import { BookingPage }    from "../pages/BookingPage";
import { ReportHelper }   from "../utils/reportHelper";
import { ExcelReader, BookHotelData } from "../utils/excelReader";
import { TestConfig }     from "../config/testConfig";
import { getFutureDate }  from "../utils/dateHelper";

// ── Load test data from Excel ────────────────────────────────────────
let testRows: BookHotelData[] = [];

try {
  const reader = new ExcelReader(TestConfig.excelFilePath);
  testRows = reader.getSheetData<BookHotelData>("BookHotel");
} catch {
  testRows = [
    {
      TestCaseId:           "TC_BOOK_01",
      Location:             TestConfig.search.location,
      CheckInOffset:        TestConfig.search.checkInOffsetDays,
      CheckOutOffset:       TestConfig.search.checkOutOffsetDays,
      Adults:               1,
      GuestFirstName:       TestConfig.guest.firstName,
      GuestLastName:        TestConfig.guest.lastName,
      GuestEmail:           TestConfig.guest.email,
      GuestPhone:           TestConfig.guest.phone,
      SpecialRequest:       TestConfig.guest.specialRequest,
      CardNumber:           TestConfig.card.number,
      CardName:             TestConfig.card.name,
      CardExpiry:           TestConfig.card.expiry,
      CardCvv:              TestConfig.card.cvv,
      ExpectedErrorMessage: "invalid",  // partial match
    },
  ];
}

// ── Tests ────────────────────────────────────────────────────────────

test.describe("Scenario 2 — Book Hotel With Dummy Card (Observe Error)", () => {
  test.describe.configure({ mode: "serial" });

  for (const row of testRows) {
    test(`[${row.TestCaseId}] Book hotel in ${row.Location} — expect payment error`, async (
      { page }, testInfo
    ) => {
      const report     = new ReportHelper(page, testInfo);
      const homePage   = new HomePage(page);
      const listPage   = new HotelListPage(page);
      const detailPage = new HotelDetailPage(page);
      const bookPage   = new BookingPage(page);

      report.addMetadata("Feature",    "Hotel Booking");
      report.addMetadata("TestCaseId", row.TestCaseId);
      report.addMetadata("Location",   row.Location);

      // ── Step 1-2: Open & Search ────────────────────────────────
      report.info("Step 1: Opening goibibo.com");
      await homePage.open();

      report.info(`Step 2: Searching hotels in ${row.Location}`);
      const checkIn  = getFutureDate(row.CheckInOffset  || 7);
      const checkOut = getFutureDate(row.CheckOutOffset || 9);   // > 1 day

      await homePage.searchHotel({
        location: row.Location,
        checkIn,
        checkOut,
        adults: row.Adults || 1,
      });
      await report.screenshot("Search Results");

      // ── Step 3: Log hotel name & count ─────────────────────────
      report.info("Step 3: Logging hotel name and count");
      await listPage.waitForResults();
      const hotelNames  = await listPage.getAllHotelNames();
      const totalCount  = await listPage.getTotalHotelCount();
      const firstHotel  = hotelNames[0] ?? "";

      report.pass(`Hotel Name: ${firstHotel}`);
      report.pass(`Total Count: ${totalCount}`);
      await report.logHotelList(hotelNames, totalCount);

      // ── Step 4: Verify title & click hotel ────────────────────
      report.info(`Step 4: Clicking hotel "${firstHotel}"`);
      expect(firstHotel).not.toBe("");
      const clickedName = await listPage.clickFirstHotel();
      await report.screenshot("Hotel Detail Page");

      // ── Step 5: Verify name & Book Now ─────────────────────────
      report.info("Step 5: Verifying hotel name on detail page");
      const detailName = await detailPage.getHotelName();
      report.pass(`Detail page name: "${detailName}"`);

      // Names should match (partial)
      expect(detailName.toLowerCase()).toContain(
        clickedName.toLowerCase().split(" ")[0]
      );

      report.info("Clicking 'Book Now'");
      await detailPage.clickBookNow();
      await report.screenshot("Booking Page");

      // ── Step 6: Verify booking details ─────────────────────────
      report.info("Step 6: Verifying booking details");
      await bookPage.verifyBookingDetails(detailName);
      await report.screenshot("Booking Details Verified");

      // ── Step 7: Guest details ──────────────────────────────────
      report.info("Step 7: Filling guest details");
      await bookPage.fillGuestDetails({
        salutation:     TestConfig.guest.salutation,
        firstName:      row.GuestFirstName,
        lastName:       row.GuestLastName,
        email:          row.GuestEmail,
        phone:          row.GuestPhone,
        specialRequest: row.SpecialRequest,
      });
      await bookPage.clickPayButton();
      await report.screenshot("After Pay Button Click");

      // ── Step 8: Dummy card ─────────────────────────────────────
      report.info("Step 8: Entering dummy credit card details");
      await bookPage.fillCardDetails({
        number: row.CardNumber,
        name:   row.CardName,
        expiry: row.CardExpiry,
        cvv:    row.CardCvv,
      });
      await report.screenshot("Card Details Filled");
      await bookPage.clickPayNow();

      // ── Step 9: Observe error message ──────────────────────────
      report.info("Step 9: Observing error message");
      const errorMsg = await bookPage.waitForErrorAndLog();
      await report.screenshot("Error Message Observed");

      // The test PASSES as long as an error is shown (dummy card → error is expected)
      expect(
        errorMsg.length,
        `Expected a payment error message but got: "${errorMsg}"`
      ).toBeGreaterThan(0);

      report.pass(`✅ Scenario 2 PASSED — Error observed: "${errorMsg}"`);
    });
  }
});
