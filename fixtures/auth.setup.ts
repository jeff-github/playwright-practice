import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import fs from 'node:fs';

/**
 * Runs once, before the e2e project, because playwright.config.ts declares
 * `dependencies: ['setup']`. Logs in through the UI a single time and writes
 * the cookies + localStorage to disk; every e2e test then starts already
 * authenticated and never sees the login form.
 *
 * Interview answer: "auth is a fixture concern, not a test concern. Logging in
 * 40 times to test 40 things is 40x the flake surface for no coverage."
 */
const FILE = '.auth/standard.json';

setup('authenticate as standard_user', async ({ page, context }) => {
  const login = new LoginPage(page);

  await page.goto('https://www.saucedemo.com/');
  await login.loginAs('standard_user', 'secret_sauce');

  // Prove the login worked before saving state. Saving a failed login is the
  // classic silent-green bug: every later test then fails for the wrong reason.
  await expect(page).toHaveURL(/inventory\.html/);
  await expect(page.getByText('Products', { exact: true })).toBeVisible();

  fs.mkdirSync('.auth', { recursive: true });
  await context.storageState({ path: FILE });
});
