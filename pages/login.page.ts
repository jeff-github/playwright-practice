import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Where the page-object boundary sits — be ready for this question.
 *
 * In: locators, and actions that are a *single user intention* ("log in as").
 * Out: assertions about business outcomes. Those belong in the spec, so the
 *      spec still reads as the thing being proven.
 *
 * The one exception below is `expectError` — an assertion about this page's
 * own UI, not about a business rule. That line is defensible; "expectOrderTotal"
 * living in a page object would not be.
 */
export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    // getByRole / getByPlaceholder first. SauceDemo gives its inputs no
    // accessible label, so placeholder is the honest user-facing choice here —
    // and that is the answer to "why not getByLabel?".
    this.username = page.getByPlaceholder('Username');
    this.password = page.getByPlaceholder('Password');
    this.submit = page.getByRole('button', { name: 'Login' });
    this.error = page.getByTestId('error');
  }

  async goto() {
    await this.page.goto('/');
  }

  async loginAs(user: string, pass: string) {
    await this.username.fill(user);
    await this.password.fill(pass);
    await this.submit.click();
  }

  async expectError(text: string | RegExp) {
    await expect(this.error).toContainText(text);
  }
}
