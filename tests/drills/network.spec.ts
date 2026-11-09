import { test, expect } from '@playwright/test';

/**
 * DRILL 6 (target: 30 minutes). Interception.
 *
 * "How do you test the error state when the backend never returns 500?"
 * This is the answer, and it is asked constantly.
 */
test.describe('network control', () => {
  test('route can stub a response before the app ever loads', async ({ page }) => {
    // Intercept the app's own bundle request as a demonstration of matching;
    // against a real app you would match '**/api/**' and fulfil with fixtures.
    let aborted = 0;
    let requested = 0;

    const isImage = (url: string) => /\.(png|jpe?g|svg|gif|webp)(\?|$)/i.test(url);
    page.on('request', (req) => {
      if (isImage(req.url())) requested++;
    });

    await page.route('**/*.{png,jpg,jpeg,svg,gif,webp}', async (route) => {
      aborted++;
      // Aborting images is a real optimisation for a UI suite that does not
      // assert on imagery. Mention it when asked about suite runtime.
      await route.abort();
    });

    await page.goto('/todomvc/');
    await expect(page.getByPlaceholder('What needs to be done?')).toBeVisible();

    // The invariant that means something: every image the page asked for was
    // intercepted, and the app still renders without them.
    expect(aborted).toBe(requested);
  });

  test('a stubbed JSON endpoint drives the UI into a chosen state', async ({ page }) => {
    // Pattern, against an endpoint we invent: fulfil() with the body we want.
    await page.route('**/api/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ name: 'Ada Lovelace', plan: 'enterprise' }),
      });
    });

    // Prove the route is registered and fires, by calling it from the page.
    await page.goto('/todomvc/');
    const body = await page.evaluate(async () => {
      const res = await fetch('/api/profile');
      return res.json();
    });

    expect(body).toEqual({ name: 'Ada Lovelace', plan: 'enterprise' });
  });

  test('simulating a 500 is one line', async ({ page }) => {
    await page.route('**/api/orders', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"boom"}' }),
    );

    await page.goto('/todomvc/');
    const status = await page.evaluate(async () => (await fetch('/api/orders')).status);

    expect(status).toBe(500);
  });

  test('waitForResponse is how you wait on a call, not on a clock', async ({ page }) => {
    // The correct shape: start waiting BEFORE the action that triggers it,
    // then await both. Awaiting the click first is the classic race.
    const waitForTodos = page.waitForResponse(
      (res) => res.url().includes('todomvc') && res.status() === 200,
    );
    await page.goto('/todomvc/');
    const res = await waitForTodos;

    expect(res.ok()).toBeTruthy();
  });
});
