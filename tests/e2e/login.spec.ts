import { test, expect } from '../../fixtures/test-fixtures';

/**
 * DRILL 1 (target: 10 minutes, from memory, no codegen).
 * This is the live-coding task at most first-round screens.
 */
test.describe('login', () => {
  test('a locked-out user is told why, and stays on the login page', async ({ pageAs }) => {
    const page = await pageAs('locked_out_user');

    // Web-first assertion: retried until it passes or times out. The whole
    // point — compare with the flaky/ project, which asserts on a raw string.
    await expect(page.getByTestId('error')).toContainText('locked out');
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('a bad password does not reveal whether the user exists', async ({ pageAs }) => {
    const page = await pageAs('no_such_user');

    // A security-minded assertion. Interviewers notice when a candidate
    // asserts on behaviour that matters, not just on "an error appeared".
    const error = page.getByTestId('error');
    await expect(error).toBeVisible();
    await expect(error).toContainText('Username and password do not match');
  });

  test('the saved session skips the login form entirely', async ({ page }) => {
    // No login steps here. storageState from the setup project did it once.
    await page.goto('/inventory.html');
    await expect(page.getByText('Products', { exact: true })).toBeVisible();
  });
});
