import { type Page, type Locator } from '@playwright/test';

export class CheckoutPage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly itemTotal: Locator;
  readonly tax: Locator;
  readonly total: Locator;
  readonly completeHeader: Locator;

  constructor(private readonly page: Page) {
    this.firstName = page.getByPlaceholder('First Name');
    this.lastName = page.getByPlaceholder('Last Name');
    this.postalCode = page.getByPlaceholder('Zip/Postal Code');
    this.itemTotal = page.locator('.summary_subtotal_label');
    this.tax = page.locator('.summary_tax_label');
    this.total = page.locator('.summary_total_label');
    this.completeHeader = page.getByText('Thank you for your order!');
  }

  async fillDetails(first: string, last: string, zip: string) {
    await this.firstName.fill(first);
    await this.lastName.fill(last);
    await this.postalCode.fill(zip);
    await this.page.getByRole('button', { name: 'Continue' }).click();
  }

  async finish() {
    await this.page.getByRole('button', { name: 'Finish' }).click();
  }

  /** Parses "Item total: $29.99" -> 29.99 */
  private static money(text: string): number {
    const m = text.match(/\$([\d.]+)/);
    if (!m) throw new Error(`No amount found in: ${text}`);
    return Number(m[1]);
  }

  async subtotal(): Promise<number> {
    return CheckoutPage.money(await this.itemTotal.innerText());
  }

  async taxAmount(): Promise<number> {
    return CheckoutPage.money(await this.tax.innerText());
  }

  async grandTotal(): Promise<number> {
    return CheckoutPage.money(await this.total.innerText());
  }
}
