import { test, expect } from '@playwright/test';
import { mountAsyncApp } from '../../fixtures/async-app';

/**
 * ============================================================
 *  THE FLAKE STORY — part 2 of 2. The same four tests, corrected.
 * ============================================================
 *
 * Prove the fixes hold:
 *   npx playwright test --project=flaky-demo fixed.spec.ts --repeat-each=50
 *
 * That command is the evidence to show an interviewer. "I fixed it" is a claim;
 * "it survives 50 repeats, and here is the trace from before" is proof.
 *
 * Note what did NOT change: no sleeps were added, no timeouts raised. Every fix
 * is a smaller test than the broken version. That is the tell of a real fix —
 * raising a timeout to make a race pass is the thing to argue against when an
 * interviewer suggests it.
 */
test.describe('the fixes', () => {
  test('FIX 1: a web-first assertion polls until the UI catches up', async ({ page }) => {
    await mountAsyncApp(page);
    await page.getByRole('button', { name: 'Add item' }).click();

    // expect(locator).toHaveText() re-reads until it matches or the expect
    // timeout expires. No value snapshotted mid-update.
    await expect(page.getByTestId('count')).toHaveText('1 item');
  });

  test('FIX 2: wait on the condition, not on a duration', async ({ page }) => {
    await mountAsyncApp(page);
    await page.getByRole('button', { name: 'Add item' }).click();

    // toHaveCount() is retried, so this waits exactly as long as it needs to
    // and no longer — and it states what it is waiting for.
    await expect(page.getByTestId('item')).toHaveCount(1);
  });

  test('FIX 3: locate by what the user sees, then scope inward', async ({ page }) => {
    await page.goto('/todomvc/');
    const input = page.getByPlaceholder('What needs to be done?');
    for (const t of ['alpha', 'beta']) {
      await input.fill(t);
      await input.press('Enter');
    }

    // Content-based, order-independent, and it reads like the requirement.
    const alpha = page.getByTestId('todo-item').filter({ hasText: 'alpha' });
    await expect(alpha).toHaveCount(1);
    await expect(alpha.getByRole('checkbox')).not.toBeChecked();
  });

  test('FIX 4: assert the outcome instead of catching the failure', async ({ page }) => {
    await mountAsyncApp(page);
    await page.getByRole('button', { name: 'Add item' }).click();

    // No try/catch, no boolean. If the item never arrives, the test fails and
    // says so. An assertion that cannot fail is not an assertion.
    await expect(page.getByTestId('item')).toHaveCount(1);
    await expect(page.getByTestId('item')).toHaveText(['item 1']);
  });
});
