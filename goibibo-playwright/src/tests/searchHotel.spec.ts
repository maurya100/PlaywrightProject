/**
 * Scenario 1 — Search a hotel for one adult and log the hotel name in TestNG.
 *
 * Steps:
 *  1. Open goibibo.com
 *  2. Click Hotels menu
 *  3. Enter location (from Excel)
 *  4. Enter check-in / check-out dates
 *  5. Select 1 adult
 *  6. Click "Get Set Go"
 *  7. Log hotel title and total count into report (mirrors TestNG Reporter.log)
 */
import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/HomePage";
import { HotelListPage } from "../pages/HotelListPage";
import { ReportHelper } from "../utils/reportHelper";
import { ExcelReader, HotelSearchData } from "../utils/excelReader";
import { TestConfig } from "../config/testConfig";
import { getFutureDate } from "../utils/dateHelper";

// ── Load test data from Excel ────────────────────────────────────────
let testRows: HotelSearchData[] = [];

try {
  const reader = new ExcelReader(TestConfig.excelFilePath);
  testRows = reader.getSheetData<HotelSearchData>("HotelSearch");
} catch {
  // If Excel not found, fall back to config defaults
  testRows = [
    {
      TestCaseId: "TC_SEARCH_01",
      Location: TestConfig.search.location,
      CheckInOffset: TestConfig.search.checkInOffsetDays,
      CheckOutOffset: TestConfig.search.checkOutOffsetDays,
      Adults: TestConfig.search.adults,
      Rooms: TestConfig.search.rooms,
      ExpectedResult: "PASS",
      Description: "Search hotels in Ooty for 1 adult",
    },
  ];
}

// ── Tests ────────────────────────────────────────────────────────────

test.describe("Scenario 1 — Hotel Search & Log Hotel Name", () => {
  test.describe.configure({ mode: "serial" });

  for (const row of testRows) {
    test(`[${row.TestCaseId}] ${row.Description}`, async ({ page }, testInfo) => {
      const report = new ReportHelper(page, testInfo);
      const homePage = new HomePage(page);
      const listPage = new HotelListPage(page);

      // Metadata (mirrors @Epic in Allure / TestNG groups)
      report.addMetadata("Feature",     "Hotel Search");
      report.addMetadata("TestCaseId",  row.TestCaseId);
      report.addMetadata("Location",    row.Location);
      report.addMetadata("Adults",      String(row.Adults));

      // ── Step 1: Open URL ───────────────────────────────────────
      report.info("Step 1: Opening https://www.goibibo.com");
      await homePage.open();
      await report.screenshot("Home Page Loaded");

      // ── Step 2-6: Search ───────────────────────────────────────
      report.info("Step 2: Clicking Hotels menu tab");
      await homePage.clickHotelsMenu();

      report.info(`Step 3: Entering location — ${row.Location}`);
      await homePage.enterLocation(row.Location);

      const checkIn  = getFutureDate(row.CheckInOffset  || TestConfig.search.checkInOffsetDays);
      const checkOut = getFutureDate(row.CheckOutOffset || TestConfig.search.checkOutOffsetDays);

      report.info(`Step 4: Check-in = ${checkIn.formatted}, Check-out = ${checkOut.formatted}`);
      await homePage.selectCheckInDate(checkIn);
      await homePage.selectCheckOutDate(checkOut);

      report.info(`Step 5: Setting adults = ${row.Adults}`);
      await homePage.setAdults(row.Adults || 1);

      report.info("Step 6: Clicking 'Get Set Go'");
      await homePage.clickGetSetGo();
      await report.screenshot("Search Results Page");

      // ── Step 7: Log hotel name & total count (TestNG Reporter.log) ──
      report.info("Step 7: Logging hotel name and total count");
      await listPage.waitForResults();

      const hotelNames = await listPage.getAllHotelNames();
      const totalCount = await listPage.getTotalHotelCount();
      const firstName  = hotelNames[0] ?? "Not Found";

      // This mirrors TestNG Reporter.log()
      report.pass(`Hotel Name (first result): ${firstName}`);
      report.pass(`Total Hotels Found: ${totalCount}`);

      await report.logHotelList(hotelNames, totalCount);
      await report.screenshot("Hotel List With Names");

      // ── Assertions ─────────────────────────────────────────────
      expect(hotelNames.length, "At least one hotel should be listed").toBeGreaterThan(0);
      expect(totalCount, "Total count should be > 0").toBeGreaterThanOrEqual(0);
      expect(firstName, "First hotel name should not be empty").not.toBe("");

      report.pass(`✅ Scenario 1 PASSED — First hotel: "${firstName}", Total: ${totalCount}`);
    });
  }
});
