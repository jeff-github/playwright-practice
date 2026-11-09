import { test, expect } from '@playwright/test';

/**
 * DRILL 4 (target: 20 minutes). The senior-vs-mid question.
 *
 * "You need to test the 'clear completed' button with 50 todos. Do you click
 * 50 times?" No. You put the state in place directly, then assert on the UI.
 *
 * Here that is `addInitScript`, which runs before any page script — the
 * browser-side equivalent of seeding a database. Against a real app you would
 * do the same thing through the `request` fixture or a direct DB seed.
 */

type Todo = { id: string; title: string; completed: boolean };

const seed = (todos: Todo[]) => ({
  // TodoMVC persists to localStorage under this key.
  key: 'react-todos',
  value: JSON.stringify(todos),
});

function makeTodos(count: number, completedEvery = 0): Todo[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `seed-${i}`,
    title: `seeded item ${i + 1}`,
    completed: completedEvery > 0 && i % completedEvery === 0,
  }));
}

test.describe('seeded state', () => {
  test('a seeded list renders without a single click', async ({ page }) => {
    const todos = makeTodos(50);

    await page.addInitScript(({ key, value }) => {
      window.localStorage.setItem(key, value);
    }, seed(todos));

    await page.goto('/todomvc/');

    await expect(page.getByTestId('todo-item')).toHaveCount(50);
    await expect(page.getByText('50 items left')).toBeVisible();
  });

  test('clear completed removes only the completed items', async ({ page }) => {
    // 12 todos, every third one already done -> 4 completed, 8 left.
    const todos = makeTodos(12, 3);
    const completed = todos.filter((t) => t.completed).length;

    await page.addInitScript(({ key, value }) => {
      window.localStorage.setItem(key, value);
    }, seed(todos));

    await page.goto('/todomvc/');
    await expect(page.getByTestId('todo-item')).toHaveCount(12);

    await page.getByRole('button', { name: 'Clear completed' }).click();

    await expect(page.getByTestId('todo-item')).toHaveCount(12 - completed);
    await expect(page.getByRole('button', { name: 'Clear completed' })).toHaveCount(0);
  });
});
