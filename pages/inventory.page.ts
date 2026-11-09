import { type Page, type Locator } from '@playwright/test';

export class InventoryPage {
  readonly title: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;
  readonly sortBy: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByText('Products', { exact: true });
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.cartLink = page.locator('.shopping_cart_link');
    this.sortBy = page.getByTestId('product-sort-container');
  }

  async goto() {
    await this.page.goto('/inventory.html');
  }

  /**
   * Scoping a locator to a card, then reaching inside it, is the pattern
   * worth showing in an interview: it survives reordering and does not
   * depend on nth-child.
   */
  item(name: string): Locator {
    return this.page.locator('.inventory_item').filter({ hasText: name });
  }

  async addToCart(name: string) {
    await this.item(name).getByRole('button', { name: 'Add to cart' }).click();
  }

  async priceOf(name: string): Promise<number> {
    const text = await this.item(name).locator('.inventory_item_price').innerText();
    return Number(text.replace('$', ''));
  }

  async openCart() {
    await this.cartLink.click();
  }
}
