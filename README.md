# playwright-practice

A Playwright suite built to be **narrated in an interview**, not just run. Every
file answers a question an SDET panel actually asks, and the comments say which
question.

```bash
npm install
npx playwright install chromium
npm test
```

## What each part is for

| Path | The interview question it answers |
|---|---|
| `playwright.config.ts` | "How would you shape a suite for CI?" |
| `fixtures/auth.setup.ts` | "How do you handle login without doing it 40 times?" |
| `fixtures/test-fixtures.ts` | "Fixtures or `beforeEach`? Why?" |
| `fixtures/async-app.ts` | "Why did that bad assertion pass for six months?" |
| `pages/` | "Where do you draw the page-object boundary?" |
| `tests/e2e/checkout.spec.ts` | "Walk me through a test you wrote." |
| `tests/api/posts.spec.ts` | "How do you test without the UI?" |
| `tests/drills/seeded-state.spec.ts` | "You need 50 records. Do you click 50 times?" |
| `tests/drills/network.spec.ts` | "How do you test the 500 the backend never returns?" |
| `tests/flaky/` | "Tell me about a flaky test you fixed." |
| `.github/workflows/ci.yml` | "How does this run on four machines?" |

## Commands worth having in muscle memory

> **`npm test`, not `npx playwright test`.** The npm script names its projects
> explicitly so the broken-by-design `flaky-demo` project stays out. A bare
> `npx playwright test` includes it and goes red on purpose — that is what
> `npm run flaky` is for, and it is also why CI runs `npm test -- --shard=...`.

```bash
npm test                  # setup + e2e + api + drills
npm run test:api          # no browser, ~1s
npm run ui                # UI mode: watch, time-travel, pick locators
npm run flaky             # the broken specs, 10 repeats, watch them wobble
npx playwright test -g "order total"          # run one test by name
npx playwright test --debug                   # step through in Inspector
npx playwright test --repeat-each=50 fixed.spec.ts   # prove a fix
npx playwright show-report                    # last HTML report
npx playwright show-trace test-results/<dir>/trace.zip
```

## Targets

| Target | Used by | Why |
|---|---|---|
| `saucedemo.com` | `tests/e2e` | Stable login/cart flow, several deliberately broken users |
| `demo.playwright.dev/todomvc` | `tests/drills`, `tests/flaky` | The app from Playwright's own docs. Tiny and predictable |
| `jsonplaceholder.typicode.com` | `tests/api` | Reliable REST shapes for contract-style assertions |

**Run something locally too.** Demo sites go down, and they will go down the
night before an interview. `practicesoftwaretesting.com` ships a
`docker-compose.yml` with a real REST API, which is the only way to practise the
full *seed via API, assert in the UI, tear down* loop against data you own.

## The flake story — the part most candidates skip

`tests/flaky/flaky.spec.ts` holds four defects, one per test, each named in its
title. `fixed.spec.ts` holds the same four, corrected. Verified behaviour:

| Defect | Behaviour |
|---|---|
| 1 — non-retrying read (`innerText()` + `expect(string)`) | fails every run |
| 2 — hard sleep (`waitForTimeout(50)`) | fails every run |
| 3 — position-dependent locator (`li:nth-child(2)`) | fails every run |
| 4 — swallowed timeout (`.catch(() => false)`) | **never fails, and tests nothing** |

Defect 4 is the one to lead with. The other three go red and get fixed; a
suite full of defect 4 is the team that says "we have 400 passing tests" and
ships bugs anyway.

The sequence to rehearse out loud:

1. `npm run flaky` — 1, 2 and 3 go red; 4 goes green while proving nothing.
2. Open the trace: `npx playwright show-trace test-results/<dir>/trace.zip`.
3. Point at the moment in the timeline where the read fired before the update
   landed.
4. Show the fix in `fixed.spec.ts` — and point out that every fix is *shorter*
   than the broken version. No sleeps added, no timeouts raised.
5. `npx playwright test --project=flaky-demo fixed.spec.ts --repeat-each=50`
   and show it green. (Verified here: 80/80.)

One detail worth stealing for the conversation: defects 1 and 2 **cannot** be
made to fail against a synchronous app. The renderer is single-threaded, so a
read issued after the click queues behind the re-render and sees the right
value. That is why these bugs survive review — they only bite once something
becomes async. `fixtures/async-app.ts` is a 20-line app with a deferred update
that exposes them deterministically, and explains the reasoning in its header.

That is five minutes of material, with evidence, for the question everyone asks.

## Honest gaps

Worth knowing before you claim this repo covers more than it does:

- **One browser installed.** `npx playwright install firefox webkit`, then
  uncomment the `e2e-webkit` project in the config.
- **No visual regression.** Baselines are platform-specific, so adding
  `toHaveScreenshot()` only means something once it runs in the CI container.
- **No component tests.** Playwright's component testing is still experimental;
  know that it exists and that it is not what these jobs mean by Playwright.
- **No real seed-then-UI test**, for the reason given under Targets.
- **No accessibility checks.** `@axe-core/playwright` is a half-hour addition
  and comes up in interviews more often than you would expect.

See `DRILLS.md` for the timed practice ladder.
