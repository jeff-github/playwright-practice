import { test, expect } from '../../fixtures/test-fixtures';

/**
 * DRILL 2 (target: 20 minutes).
 *
 * This is the test to walk an interviewer through, because it asserts on a
 * *business rule* (the totals add up) rather than on "the page loaded". The
 * arithmetic check is what makes it a test rather than a click-through.
 */
test.describe('checkout', () => {
  const ITEMS = ['Sauce Labs Backpack', 'Sauce Labs Bike Light'];

  test('order total equals the sum of items plus tax', async ({ inventory, checkout, page }) => {
    let expectedSubtotal = 0;
    for (const item of ITEMS) {
      expectedSubtotal += await inventory.priceOf(item);
      await inventory.addToCart(item);
    }

    await expect(inventory.cartBadge).toHaveText(String(ITEMS.length));
    await inventory.openCart();
    await page.getByRole('button', { name: 'Checkout' }).click();

    await checkout.fillDetails('Ada', 'Lovelace', '12345');

    const subtotal = await checkout.subtotal();
    const tax = await checkout.taxAmount();
    const total = await checkout.grandTotal();

    // Floating point: compare in cents, not with ===. A detail interviewers
    // like, because it shows you have been burned before.
    expect(Math.round(subtotal * 100)).toBe(Math.round(expectedSubtotal * 100));
    expect(Math.round(total * 100)).toBe(Math.round((subtotal + tax) * 100));

    await checkout.finish();
    await expect(checkout.completeHeader).toBeVisible();
  });

  test('the cart badge clears after an order completes', async ({ inventory, checkout, page }) => {
    await inventory.addToCart(ITEMS[0]);
    await inventory.openCart();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await checkout.fillDetails('Ada', 'Lovelace', '12345');
    await checkout.finish();

    await expect(checkout.completeHeader).toBeVisible();
    // Asserting on absence is its own skill: toHaveCount(0), not a try/catch.
    await expect(page.locator('.shopping_cart_badge')).toHaveCount(0);
  });
});
