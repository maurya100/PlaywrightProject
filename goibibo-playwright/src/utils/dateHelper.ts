/**
 * DateHelper — utilities for generating and formatting test dates.
 * Goibibo uses a calendar picker so we need to navigate month/day cells.
 */

export interface GoibiboDate {
  day: number;
  monthShort: string;   // "Jan", "Feb", ...
  monthFull: string;    // "January", "February", ...
  year: number;
  /** DD Mon YYYY  e.g. "07 Jun 2025" */
  formatted: string;
  /** ISO  e.g. "2025-06-07" */
  iso: string;
}

const MONTHS_SHORT = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];
const MONTHS_FULL = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export function getFutureDate(offsetDays: number): GoibiboDate {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);

  const day   = d.getDate();
  const month = d.getMonth();
  const year  = d.getFullYear();

  return {
    day,
    monthShort: MONTHS_SHORT[month],
    monthFull:  MONTHS_FULL[month],
    year,
    formatted: `${String(day).padStart(2,"0")} ${MONTHS_SHORT[month]} ${year}`,
    iso: d.toISOString().split("T")[0],
  };
}

/** Format for Goibibo's date input fields (if text-editable). */
export function formatForInput(date: GoibiboDate): string {
  return `${String(date.day).padStart(2,"0")}/${String(
    MONTHS_SHORT.indexOf(date.monthShort) + 1
  ).padStart(2,"0")}/${date.year}`;
}
