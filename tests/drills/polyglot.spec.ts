import { test, expect } from '@playwright/test';

/**
 * The reference test, in TypeScript. The Python, Java and C# versions of this
 * same test live in docs/polyglot/ for comparison.
 */
test('adding a todo shows it in the list', async ({ page }) => {
  await page.goto('https://demo.playwright.dev/todomvc/');

  const newTodo = page.getByPlaceholder('What needs to be done?');
  await newTodo.fill('write a test');
  await newTodo.press('Enter');

  await expect(page.getByTestId('todo-item')).toHaveCount(1);
  await expect(page.getByTestId('todo-title')).toHaveText('write a test');
});
