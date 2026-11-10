# The same test in four languages

One test — add a todo, assert it appears — written once per official Playwright
binding, so the differences are easy to see side by side.

The TypeScript version lives at `tests/drills/polyglot.spec.ts` because it runs
as part of this repo's `drills` project. The other three are reference files
here; each header carries its own setup commands.

| Language | File | Runner | Verified |
|---|---|---|---|
| TypeScript | `../../tests/drills/polyglot.spec.ts` | `@playwright/test` | yes — passes in 0.9s |
| Python | `test_todo.py` | pytest | yes — 1 passed in 1.94s |
| Java | `TodoTest.java` | JUnit 5 | no — needs Maven, not installed here |
| C# | `TodoTests.cs` | NUnit | no — not built here |

Python was verified in a throwaway virtualenv with `pytest-playwright`. It
emits one `DeprecationWarning` from pytest-playwright's own `base_url` fixture
under recent pytest; it comes from the plugin, not from the test.

Java and C# are written against the current APIs but have not been compiled on
this machine. Treat them as reference, not as proven.

## The point of the comparison

Each language has its own **retrying** assertion, and it is never the native
one:

| Language | Retries | Does not retry |
|---|---|---|
| TypeScript | `expect(locator)` | `expect(value)` |
| Python | `expect` from `playwright.sync_api` | `assert` |
| Java | `assertThat` from `PlaywrightAssertions` | `assertEquals` |
| C# | `Expect()` from `PageTest` | `Assert.That` |

Using the language's familiar assertion instead of Playwright's reintroduces
exactly the flake that auto-waiting exists to prevent — the same defect as
`innerText()` plus `expect(string)` in `tests/flaky/flaky.spec.ts`, wearing a
different disguise. Python makes it the easiest mistake of the four, because
`assert` is so natural there.
