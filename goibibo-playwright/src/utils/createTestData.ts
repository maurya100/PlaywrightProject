/**
 * createTestData.ts — Run this script once to generate the Excel test-data file.
 *
 * Usage:
 *   npx ts-node src/utils/createTestData.ts
 *
 * Output:
 *   test-data/TestData.xlsx  (three sheets: HotelSearch, BookHotel, HotelFilter)
 */
import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";

const OUTPUT_PATH = path.resolve("test-data/TestData.xlsx");

// ── Sheet 1: HotelSearch ─────────────────────────────────────────────
const hotelSearchRows = [
  {
    TestCaseId:       "TC_SEARCH_01",
    Location:         "Ooty",
    CheckInOffset:    7,
    CheckOutOffset:   9,
    Adults:           1,
    Rooms:            1,
    ExpectedResult:   "PASS",
    Description:      "Search hotels in Ooty for 1 adult",
  },
  {
    TestCaseId:       "TC_SEARCH_02",
    Location:         "Munnar",
    CheckInOffset:    14,
    CheckOutOffset:   16,
    Adults:           1,
    Rooms:            1,
    ExpectedResult:   "PASS",
    Description:      "Search hotels in Munnar for 1 adult",
  },
  {
    TestCaseId:       "TC_SEARCH_03",
    Location:         "Coorg",
    CheckInOffset:    10,
    CheckOutOffset:   13,
    Adults:           2,
    Rooms:            1,
    ExpectedResult:   "PASS",
    Description:      "Search hotels in Coorg for 2 adults",
  },
];

// ── Sheet 2: BookHotel ───────────────────────────────────────────────
const bookHotelRows = [
  {
    TestCaseId:           "TC_BOOK_01",
    Location:             "Ooty",
    CheckInOffset:        7,
    CheckOutOffset:       9,
    Adults:               1,
    GuestFirstName:       "Ram",
    GuestLastName:        "Kumar",
    GuestEmail:           "ram.dummy@gmail.com",
    GuestPhone:           "9090909090",
    SpecialRequest:       "veg only",
    CardNumber:           "4111111111111111",
    CardName:             "Ram Kumar",
    CardExpiry:           "12/26",
    CardCvv:              "123",
    ExpectedErrorMessage: "invalid",
  },
  {
    TestCaseId:           "TC_BOOK_02",
    Location:             "Ooty",
    CheckInOffset:        14,
    CheckOutOffset:       17,
    Adults:               1,
    GuestFirstName:       "John",
    GuestLastName:        "Doe",
    GuestEmail:           "john.doe@test.com",
    GuestPhone:           "8080808080",
    SpecialRequest:       "non-smoking room",
    CardNumber:           "5500000000000004",
    CardName:             "John Doe",
    CardExpiry:           "06/27",
    CardCvv:              "456",
    ExpectedErrorMessage: "invalid",
  },
];

// ── Sheet 3: HotelFilter ─────────────────────────────────────────────
const hotelFilterRows = [
  {
    TestCaseId:      "TC_FILTER_01",
    Location:        "Ooty",
    CheckInOffset:   7,
    CheckOutOffset:  9,
    PayAtHotel:      "Yes",
    Rating:          "4",
    PriceRangeIndex: 0,
    ExpectedResult:  "PASS",
  },
  {
    TestCaseId:      "TC_FILTER_02",
    Location:        "Ooty",
    CheckInOffset:   14,
    CheckOutOffset:  16,
    PayAtHotel:      "No",
    Rating:          "3.5",
    PriceRangeIndex: 1,
    ExpectedResult:  "PASS",
  },
];

// ── Build workbook ────────────────────────────────────────────────────
function buildWorkbook(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const wsSearch = XLSX.utils.json_to_sheet(hotelSearchRows);
  XLSX.utils.book_append_sheet(wb, wsSearch, "HotelSearch");

  const wsBook = XLSX.utils.json_to_sheet(bookHotelRows);
  XLSX.utils.book_append_sheet(wb, wsBook, "BookHotel");

  const wsFilter = XLSX.utils.json_to_sheet(hotelFilterRows);
  XLSX.utils.book_append_sheet(wb, wsFilter, "HotelFilter");

  return wb;
}

// ── Main ──────────────────────────────────────────────────────────────
function main(): void {
  const dir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const wb = buildWorkbook();
  XLSX.writeFile(wb, OUTPUT_PATH);
  console.log(`✅ Test data file created: ${OUTPUT_PATH}`);
  console.log(`   Sheets: HotelSearch (${hotelSearchRows.length} rows), BookHotel (${bookHotelRows.length} rows), HotelFilter (${hotelFilterRows.length} rows)`);
}

main();
