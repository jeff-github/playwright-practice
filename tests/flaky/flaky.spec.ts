import { test, expect } from '@playwright/test';
import { mountAsyncApp } from '../../fixtures/async-app';

/**
 * ============================================================
 *  THE FLAKE STORY — part 1 of 2. These tests are WRONG ON PURPOSE.
 * ============================================================
 *
 * Run them:   npm run flaky
 * Then read:  tests/flaky/fixed.spec.ts
 *
 * Every interview asks "tell me about a flaky test you fixed." Having the
 * before, the after, and a trace of the failure beats any story you improvise.
 *
 * Four defects, one per test, each named in its title:
 *   1. a non-retrying read            -> fails every run
 *   2. a hard sleep                   -> fails every run
 *   3. a position-dependent locator   -> fails every run
 *   4. a swallowed timeout            -> NEVER fails, and tests nothing
 *
 * Defects 1, 2 and 4 run against fixtures/async-app.ts, a deliberately
 * deferred app. That file explains why: against a synchronous app these bugs
 * hide, which is exactly how they reach main.
 */
test.describe('anti-patterns', () => {
  test('DEFECT 1: asserts on a non-retrying read', async ({ page }) => {
    await mountAsyncApp(page);
    await page.getByRole('button', { name: 'Add item' }).click();

    // innerText() resolves ONCE, the moment it is called. There is no retry.
    // The element already exists holding the OLD value, so this reads
    // "0 items". expect(locator).toHaveText() would poll; expect(string) cannot.
    const text = await page.getByTestId('count').innerText();
    expect(text).toBe('1 item');
  });

  test('DEFECT 2: a hard sleep standing in for a condition', async ({ page }) => {
    await mountAsyncApp(page);
    await page.getByRole('button', { name: 'Add item' }).click();

    // 50ms is plenty on an idle laptop and nowhere near enough on a loaded CI
    // runner. The test also never says what it is waiting for, so the next
    // person cannot fix it without rediscovering the intent.
    await page.waitForTimeout(50);

    const count = await page.getByTestId('item').count();
    expect(count).toBe(1);
  });

  test('DEFECT 3: a locator that depends on DOM position', async ({ page }) => {
    await page.goto('/todomvc/');
    const input = page.getByPlaceholder('What needs to be done?');
    for (const t of ['alpha', 'beta']) {
      await input.fill(t);
      await input.press('Enter');
    }

    // Encodes the list order into the test. Any change to sort order, any new
    // wrapper element, and this points at the wrong row — while still passing
    // often enough to look fine.
    const row = page.locator('ul li:nth-child(2) div label');
    await expect(row).toHaveText('alpha');
  });

  test('DEFECT 4: registers the wait after the action, then swallows it', async ({ page }) => {
    await mountAsyncApp(page);

    // The click happens FIRST, so the deferred update can land in the gap
    // before the wait is registered...
    await page.getByRole('button', { name: 'Add item' }).click();
    const appeared = await page
      .getByTestId('item')
      .waitFor({ timeout: 100 })
      .then(() => true)
      // ...and the catch turns a real timeout into a green test. This is the
      // worst of the four: it does not fail, it just stops testing. A suite
      // full of these is the "we have 400 passing tests" that means nothing.
      .catch(() => false);

    expect([true, false]).toContain(appeared);
  });
});
