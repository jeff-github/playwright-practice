import { type Page } from '@playwright/test';

/**
 * A 20-line app whose updates arrive LATE, on purpose.
 *
 * Why this exists: against a synchronous app like TodoMVC, a non-retrying read
 * cannot actually lose the race. The browser renderer is single-threaded, so a
 * read issued after the click queues *behind* the re-render and sees the new
 * value anyway. The defect sits there looking harmless.
 *
 * Real apps are not synchronous. The list arrives from an API, a spinner shows
 * first, a framework defers the commit. This fixture reproduces that in the
 * smallest honest way — a 250ms deferred update — so the defects in
 * flaky.spec.ts fail every single time and the fixes can be proven.
 *
 * Interview-grade version of the point: "flake is a race between the test and
 * an async update. If your app never defers, the bad assertion hides; the day
 * someone adds a loading state, twelve tests go red and none of them changed."
 */
const DELAY_MS = 250;

const HTML = `
<!doctype html>
<meta charset="utf-8">
<title>Deferred list</title>
<style>
  body { font: 15px system-ui; padding: 24px; }
  li { padding: 2px 0; }
</style>
<h1>Deferred list</h1>
<button id="add">Add item</button>
<p data-testid="count">0 items</p>
<ul id="list"></ul>
<script>
  let n = 0;
  document.getElementById('add').addEventListener('click', () => {
    // The update is deferred, exactly like one waiting on a fetch.
    setTimeout(() => {
      n++;
      const li = document.createElement('li');
      li.setAttribute('data-testid', 'item');
      li.textContent = 'item ' + n;
      document.getElementById('list').appendChild(li);
      document.querySelector('[data-testid=count]').textContent =
        n + (n === 1 ? ' item' : ' items');
    }, ${DELAY_MS});
  });
</script>
`;

/** Mounts the fixture app. No network, so it is deterministic everywhere. */
export async function mountAsyncApp(page: Page) {
  await page.setContent(HTML);
}

export const ASYNC_DELAY_MS = DELAY_MS;
