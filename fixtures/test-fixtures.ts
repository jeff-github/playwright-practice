import { test as base, expect, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { InventoryPage } from '../pages/inventory.page';
import { CheckoutPage } from '../pages/checkout.page';

/**
 * Custom fixtures. This file is the answer to "how do you structure setup?"
 *
 * Why fixtures and not beforeEach:
 *   - they compose (a fixture can depend on another fixture),
 *   - they only run for the tests that actually ask for them,
 *   - teardown is tied to the fixture, not to hook ordering,
 *   - they are typed, so a spec that asks for `inventory` gets a page object
 *     and not `any`.
 *
 * The `role` pattern below is the one that gets follow-up questions in
 * interviews: a worker-scoped context per role, so a multi-role suite does not
 * log in per test.
 */

type Fixtures = {
  loginPage: LoginPage;
  inventory: InventoryPage;
  checkout: CheckoutPage;
  /** A page logged in as a named SauceDemo user, for the negative-path tests. */
  pageAs: (user: string) => Promise<Page>;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  inventory: async ({ page }, use) => {
    const inventory = new InventoryPage(page);
    await inventory.goto();
    await use(inventory);
  },

  checkout: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  pageAs: async ({ browser }, use) => {
    const opened: Page[] = [];

    await use(async (user: string) => {
      // A fresh context, deliberately WITHOUT the saved storageState, so these
      // tests exercise the real login path for that user.
      const ctx = await browser.newContext({ storageState: undefined });
      const page = await ctx.newPage();
      opened.push(page);
      const login = new LoginPage(page);
      await page.goto('https://www.saucedemo.com/');
      await login.loginAs(user, 'secret_sauce');
      return page;
    });

    // Teardown runs after the test, pass or fail.
    for (const page of opened) await page.context().close();
  },
});

export { expect };
