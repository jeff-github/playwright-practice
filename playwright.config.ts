import { defineConfig, devices } from '@playwright/test';

/**
 * Interview talking points live in this file. Be ready to defend every line.
 *
 *  - projects, not folders, are how you slice a suite: by browser, by role,
 *    by environment, or by dependency order (setup -> e2e).
 *  - `dependencies` is how auth gets done once instead of per test.
 *  - trace/screenshot/video on failure only: near-zero cost on green runs,
 *    the difference between a diagnosable red build and a guess.
 */
export default defineConfig({
  testDir: './tests',

  // Every test file AND every test inside it runs in parallel. Forces the
  // independence you want; anything leaning on another test's data fails loudly.
  fullyParallel: true,

  // A stray test.only must never silently shrink the CI run.
  forbidOnly: !!process.env.CI,

  // Retry on CI only. Retrying locally hides flake you should be fixing.
  retries: process.env.CI ? 2 : 0,

  // Let the runner decide locally; pin on CI so shards are predictable.
  workers: process.env.CI ? 2 : undefined,

  timeout: 30_000,
  expect: { timeout: 5_000 },

  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['junit', { outputFile: 'results.xml' }], ['blob']]
    : [['html', { open: 'never' }], ['list']],

  use: {
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // 1. Log in once, save the storage state to disk.
    {
      name: 'setup',
      testDir: './fixtures',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], testIdAttribute: 'data-test' },
    },

    // 2. UI tests start already authenticated.
    {
      name: 'e2e',
      testDir: './tests/e2e',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://www.saucedemo.com',
        storageState: '.auth/standard.json',
        // SauceDemo marks its hooks with data-test, not the default
        // data-testid. Worth knowing this is per-project configurable —
        // the drills project keeps the default, because TodoMVC uses
        // data-testid. A real interview follow-up.
        testIdAttribute: 'data-test',
      },
    },

    // 3. No browser needed. Fast, and the answer to "how do you test
    //    without the UI?"
    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: 'https://jsonplaceholder.typicode.com' },
    },

    // 4. Timed live-coding reps. No auth, no fixtures, no excuses.
    {
      name: 'drills',
      testDir: './tests/drills',
      use: { ...devices['Desktop Chrome'], baseURL: 'https://demo.playwright.dev/todomvc' },
    },

    // 5. The flake story. `npm test` leaves this project out by listing the
    //    others explicitly; `npm run flaky` runs it 10x to watch it misbehave.
    {
      name: 'flaky-demo',
      testDir: './tests/flaky',
      use: { ...devices['Desktop Chrome'], baseURL: 'https://demo.playwright.dev/todomvc' },
    },

    // 6. Cross-engine proof. Uncomment once the other browsers are installed
    //    (`npx playwright install firefox webkit`).
    // {
    //   name: 'e2e-webkit',
    //   testDir: './tests/e2e',
    //   dependencies: ['setup'],
    //   use: { ...devices['Desktop Safari'], baseURL: 'https://www.saucedemo.com',
    //          storageState: '.auth/standard.json' },
    // },
  ],
});
