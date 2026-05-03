/**
 * ExcelReader — thin wrapper around the `xlsx` library.
 *
 * Usage:
 *   const reader = new ExcelReader('./test-data/TestData.xlsx');
 *   const rows   = reader.getSheetData<HotelSearchData>('HotelSearch');
 */
import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";

export class ExcelReader {
  private workbook: XLSX.WorkBook;
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = path.resolve(filePath);

    if (!fs.existsSync(this.filePath)) {
      throw new Error(`Excel file not found: ${this.filePath}`);
    }

    this.workbook = XLSX.readFile(this.filePath);
  }

  /**
   * Read all rows from a sheet as typed objects.
   * The first row is treated as the header.
   */
  getSheetData<T = Record<string, unknown>>(sheetName: string): T[] {
    if (!this.workbook.SheetNames.includes(sheetName)) {
      throw new Error(
        `Sheet "${sheetName}" not found. Available: ${this.workbook.SheetNames.join(", ")}`
      );
    }

    const sheet = this.workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json<T>(sheet, { defval: "" });
  }

  /** Return names of all sheets in the workbook. */
  getSheetNames(): string[] {
    return this.workbook.SheetNames;
  }

  /** Read a single cell value. */
  getCellValue(sheetName: string, cellAddress: string): unknown {
    const sheet = this.workbook.Sheets[sheetName];
    const cell = sheet[cellAddress];
    return cell ? cell.v : undefined;
  }
}

// ── Typed interfaces for each sheet ─────────────────────────────────

export interface HotelSearchData {
  TestCaseId: string;
  Location: string;
  CheckInOffset: number;  // days from today
  CheckOutOffset: number;
  Adults: number;
  Rooms: number;
  ExpectedResult: string;
  Description: string;
}

export interface BookHotelData {
  TestCaseId: string;
  Location: string;
  CheckInOffset: number;
  CheckOutOffset: number;
  Adults: number;
  GuestFirstName: string;
  GuestLastName: string;
  GuestEmail: string;
  GuestPhone: string;
  SpecialRequest: string;
  CardNumber: string;
  CardName: string;
  CardExpiry: string;
  CardCvv: string;
  ExpectedErrorMessage: string;
}

export interface HotelFilterData {
  TestCaseId: string;
  Location: string;
  CheckInOffset: number;
  CheckOutOffset: number;
  PayAtHotel: string;   // "Yes" | "No"
  Rating: string;       // "4" | "3.5" | etc.
  PriceRangeIndex: number;
  ExpectedResult: string;
}
