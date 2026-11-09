import { test, expect } from '@playwright/test';

/**
 * DRILL 5 (target: 10 minutes). Locator reps, in the recommended order.
 *
 * Do this one cold, with the docs closed, until getByRole is reflex. In a live
 * screen you will not have time to think about which locator to reach for.
 */
test.describe('locator reps', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todomvc/');
  });

  test('getByPlaceholder, then getByRole, then getByText', async ({ page }) => {
    // 1. placeholder — the input has no visible label
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('write the fixture');
    await input.press('Enter');

    // 2. role — the filter links
    await expect(page.getByRole('link', { name: 'All' })).toBeVisible();

    // 3. text — the counter
    await expect(page.getByText('1 item left')).toBeVisible();
  });

  test('scoping: filter() to reach inside one row', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    for (const title of ['first', 'second', 'third']) {
      await input.fill(title);
      await input.press('Enter');
    }

    // The pattern to show off: find the row by its content, then act within it.
    // No nth-child, so it survives reordering.
    const second = page.getByTestId('todo-item').filter({ hasText: 'second' });
    await second.getByRole('checkbox').check();

    await expect(second).toHaveClass(/completed/);
    await expect(page.getByText('2 items left')).toBeVisible();
  });

  test('strict mode: an ambiguous locator is an error, not a coin flip', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('duplicate');
    await input.press('Enter');
    await input.fill('duplicate');
    await input.press('Enter');

    // Two matches. Playwright refuses to guess — this is strict mode, and
    // "how do you handle it?" is a common follow-up.
    await expect(page.getByText('duplicate')).toHaveCount(2);

    // The fix is to narrow, not to reach for .first() out of habit.
    await expect(page.getByTestId('todo-item').nth(0)).toContainText('duplicate');
  });
});
