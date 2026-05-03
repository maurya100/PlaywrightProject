/**
 * fixtures.ts — Custom Playwright fixtures.
 *
 * Provides typed, pre-initialised Page Objects injected into every test
 * via Playwright's fixture system — the TypeScript equivalent of TestNG's
 * @BeforeMethod / dependency injection.
 *
 * Usage in a spec file:
 *   import { test, expect } from '../utils/fixtures';
 *
 *   test('my test', async ({ homePage, listPage, report }) => {
 *     await homePage.open();
 *     // ...
 *   });
 */
import { test as base, expect } from "@playwright/test";
import { HomePage }        from "../pages/HomePage";
import { HotelListPage }   from "../pages/HotelListPage";
import { HotelDetailPage } from "../pages/HotelDetailPage";
import { BookingPage }     from "../pages/BookingPage";
import { ReportHelper }    from "./reportHelper";
import { Logger }          from "./logger";

// ── Fixture type declarations ────────────────────────────────────────
export type GoibiboFixtures = {
  homePage:    HomePage;
  listPage:    HotelListPage;
  detailPage:  HotelDetailPage;
  bookPage:    BookingPage;
  report:      ReportHelper;
  logger:      Logger;
};

// ── Extended test with fixtures ───────────────────────────────────────
export const test = base.extend<GoibiboFixtures>({

  /** Automatically open a fresh HomePage for every test. */
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  listPage: async ({ page }, use) => {
    await use(new HotelListPage(page));
  },

  detailPage: async ({ page }, use) => {
    await use(new HotelDetailPage(page));
  },

  bookPage: async ({ page }, use) => {
    await use(new BookingPage(page));
  },

  /** ReportHelper wired to the current page and testInfo. */
  report: async ({ page }, use, testInfo) => {
    await use(new ReportHelper(page, testInfo));
  },

  /** Shared logger available in every test. */
  logger: async ({}, use) => {
    await use(new Logger("Test"));
  },
});

export { expect };
