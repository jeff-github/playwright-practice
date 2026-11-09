# Drills

Timed, because interviews are timed. Delete the solution, set a timer, write it
from memory. **Docs closed. Codegen off.** The point is not the code in this
repo — it is being able to produce it with a stranger watching.

Run each one cold three times before you call it done.

---

## Tier 1 — reflex (do these until they are boring)

- [ ] **10 min · login + assert** — `tests/e2e/login.spec.ts`
      Open the site, log in, assert you landed. `getByRole` / `getByPlaceholder`
      only. This is the actual task at most first-round screens.
- [ ] **10 min · locator ladder** — `tests/drills/locators.spec.ts`
      Role, label, placeholder, text, then `filter()` to scope into one row.
      Say out loud why each one, in order, as you write it.
- [ ] **5 min · run one test** — `-g`, `--project`, `--headed`, `--debug`,
      `show-trace`. Fumbling the CLI in a live screen reads as inexperience.

## Tier 2 — the senior signals

- [ ] **15 min · API layer** — `tests/api/posts.spec.ts`
      Status, headers, body shape, a 404, and a query filter asserted across
      *every* element. Then say: "this is where I push everything that is not a
      rendering concern."
- [ ] **20 min · auth fixture** — `fixtures/auth.setup.ts` + the `setup` project
      Log in once, save `storageState`, start every test authenticated. Be ready
      for "what if the token expires mid-run?"
- [ ] **20 min · seed, don't click** — `tests/drills/seeded-state.spec.ts`
      50 todos via `addInitScript`, then assert the UI. The mid-vs-senior
      question.
- [ ] **20 min · business-rule assertion** — `tests/e2e/checkout.spec.ts`
      Totals add up, compared in cents. Not "the page loaded".
- [ ] **30 min · interception** — `tests/drills/network.spec.ts`
      `route()` to fulfil, abort, and force a 500. Then `waitForResponse`
      registered *before* the action.

## Tier 3 — the ones that win the panel

- [ ] **30 min · flake triage** — `tests/flaky/`
      Four defects, four fixes, one trace, and `--repeat-each=50` as proof.
      Rehearse the five-step walkthrough in the README out loud. Lead with
      defect 4, the one that never fails and never tests anything.
- [ ] **10 min · why it hid** — read `fixtures/async-app.ts` and be able to
      explain, unprompted, why a non-retrying read passes against a synchronous
      app and fails the week someone adds a loading state.
- [ ] **45 min · from zero** — the take-home simulation.
      Empty directory to green suite: config, one page object, one UI test, one
      API test, a README defending your choices. Many SDET take-homes are
      exactly this, and the README is what they actually grade.
- [ ] **30 min · CI** — `.github/workflows/ci.yml`
      Four shards, `merge-reports`, artifacts uploaded. Push it and get the
      badge green. Be able to explain shards vs workers without hesitating.

## Tier 4 — verbal only, no editor

Say these out loud, in full sentences, until they stop coming out mushy. The
question bank is the Playwright FAQ doc in your Downloads folder.

- [ ] Why `getByRole` over CSS — and when CSS is still right
- [ ] What auto-waiting checks, and why that removes most flake
- [ ] `browser` vs `context` vs `page`, and why tests don't leak state
- [ ] Workers vs shards
- [ ] Fixtures vs `beforeEach` — the three reasons
- [ ] When Playwright is the **wrong** tool (native apps, load testing)
- [ ] Why your screenshot baselines fail on CI but pass locally
- [ ] How you'd introduce this suite to a team that has 400 flaky Selenium tests

---

## Scoring yourself

| Signal | What it means |
|---|---|
| Finished inside the time, docs closed | Ready |
| Finished, but looked something up | One more rep |
| Right idea, wrong syntax | Reps, not reading |
| Had to think about *which* locator | Tier 1 again |

Two weeks at one tier-1 drill plus one tier-2 drill per day is enough to walk
into a screen without your hands shaking.
