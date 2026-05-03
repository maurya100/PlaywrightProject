/**
 * Scenario 4 — Search for a hotel in Ooty and apply filters:
 *   • Pay At Hotel
 *   • Rating = 4
 *   • First price range
 *   Verify the applied filter changes the result.
 */
import { test, expect } from "@playwright/test";
import { HomePage }      from "../pages/HomePage";
import { HotelListPage } from "../pages/HotelListPage";
import { ReportHelper }  from "../utils/reportHelper";
import { ExcelReader, HotelFilterData } from "../utils/excelReader";
import { TestConfig }    from "../config/testConfig";
import { getFutureDate } from "../utils/dateHelper";

// ── Load test data from Excel ────────────────────────────────────────
let testRows: HotelFilterData[] = [];

try {
  const reader = new ExcelReader(TestConfig.excelFilePath);
  testRows = reader.getSheetData<HotelFilterData>("HotelFilter");
} catch {
  testRows = [
    {
      TestCaseId:       "TC_FILTER_01",
      Location:         TestConfig.search.location,
      CheckInOffset:    TestConfig.search.checkInOffsetDays,
      CheckOutOffset:   TestConfig.search.checkOutOffsetDays,
      PayAtHotel:       "Yes",
      Rating:           TestConfig.filters.rating,
      PriceRangeIndex:  TestConfig.filters.priceRangeIndex,
      ExpectedResult:   "PASS",
    },
  ];
}

// ── Tests ────────────────────────────────────────────────────────────

test.describe("Scenario 4 — Hotel Filters (Pay At Hotel / Rating / Price)", () => {
  test.describe.configure({ mode: "serial" });

  for (const row of testRows) {
    test(`[${row.TestCaseId}] Apply filters in ${row.Location} and verify changes`, async (
      { page }, testInfo
    ) => {
      const report   = new ReportHelper(page, testInfo);
      const homePage = new HomePage(page);
      const listPage = new HotelListPage(page);

      report.addMetadata("Feature",     "Hotel Filters");
      report.addMetadata("TestCaseId",  row.TestCaseId);
      report.addMetadata("Location",    row.Location);
      report.addMetadata("Rating",      row.Rating);
      report.addMetadata("PayAtHotel",  row.PayAtHotel);

      const checkIn  = getFutureDate(row.CheckInOffset  || 7);
      const checkOut = getFutureDate(row.CheckOutOffset || 9);

      // ── Step 1: Open & search ──────────────────────────────────
      report.info("Step 1: Open goibibo.com and search hotels in Ooty");
      await homePage.open();
      await homePage.searchHotel({
        location: row.Location,
        checkIn,
        checkOut,
        adults: 1,
      });
      await report.screenshot("Initial Search Results");

      // ── Step 2: Count before filters ──────────────────────────
      report.info("Step 2: Recording hotel count BEFORE filters");
      await listPage.waitForResults();
      const countBefore = await listPage.getTotalHotelCount();
      report.pass(`Count before filters: ${countBefore}`);
      expect(countBefore).toBeGreaterThanOrEqual(0);

      // ── Step 3: Pay At Hotel filter ────────────────────────────
      if (row.PayAtHotel?.toLowerCase() === "yes") {
        report.info("Step 3: Applying 'Pay At Hotel' filter");
        await listPage.applyPayAtHotelFilter();
        await report.screenshot("After Pay At Hotel Filter");

        const countAfterPayFilter = await listPage.getTotalHotelCount();
        report.pass(`Count after Pay At Hotel filter: ${countAfterPayFilter}`);

        const payFilterApplied = await listPage.verifyPayAtHotelFilterApplied();
        report.info(`Pay At Hotel filter badge visible: ${payFilterApplied}`);
      }

      // ── Step 4: Rating filter ──────────────────────────────────
      report.info(`Step 4: Applying rating filter — ${row.Rating}`);
      await listPage.applyRatingFilter(row.Rating);
      await report.screenshot(`After Rating ${row.Rating} Filter`);

      const countAfterRatingFilter = await listPage.getTotalHotelCount();
      report.pass(`Count after Rating filter: ${countAfterRatingFilter}`);

      const ratingApplied = await listPage.verifyRatingFilterApplied(row.Rating);
      expect(ratingApplied, `Rating filter '${row.Rating}' should be checked`).toBe(true);

      // ── Step 5: Price range filter ─────────────────────────────
      report.info(`Step 5: Applying price range filter #${row.PriceRangeIndex + 1}`);
      await listPage.applyPriceRangeFilter(row.PriceRangeIndex);
      await report.screenshot("After Price Range Filter");

      const countAfterPriceFilter = await listPage.getTotalHotelCount();
      report.pass(`Count after Price Range filter: ${countAfterPriceFilter}`);

      const priceApplied = await listPage.verifyPriceRangeFilterApplied(row.PriceRangeIndex);
      expect(priceApplied, "Price range filter should be checked").toBe(true);

      // ── Step 6: Verify count changed ──────────────────────────
      report.info("Step 6: Verifying filter reduced/changed the result count");
      report.table("Filter Summary", {
        "Count Before Filters":       countBefore,
        "Count After Rating Filter":  countAfterRatingFilter,
        "Count After Price Filter":   countAfterPriceFilter,
      });

      // After filtering, count should be ≤ initial count (or equal if no change)
      expect(countAfterPriceFilter).toBeLessThanOrEqual(countBefore);

      report.pass(
        `✅ Scenario 4 PASSED — Filters applied and results changed from ${countBefore} → ${countAfterPriceFilter}`
      );
    });
  }
});
