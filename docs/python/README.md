# Python: the data types that show up in Playwright tests

`test_data_types.py` is a worked example per data type, written to be read as
much as run. It is **not** part of the JavaScript suite — Playwright's
`testDir` never looks in `docs/`, so `npm test` ignores it entirely.

## Running it

```bash
cd docs/python
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt   # Windows
# .venv/bin/python -m pip install -r requirements.txt      # macOS / Linux
.venv/Scripts/python -m playwright install chromium
.venv/Scripts/python -m pytest test_data_types.py -q
```

Verified result: **21 passed in 7.31s** on Python 3.14.4, Windows 11, against
the TodoMVC demo app and jsonplaceholder.

The run emits one `PytestRemovedIn10Warning` from `pytest-playwright`'s own
`base_url` fixture under pytest 9. It comes from the plugin, not from these
tests.

## What it covers

| Type | Where it shows up |
|---|---|
| `dict` | API payloads, `response.json()`, `storage_state()`, device descriptors |
| `list` | parametrize tables, `all_text_contents()`, the list form of `to_have_text` |
| `tuple` | multi-argument parametrize cases |
| `set` | comparing an unordered collection without asserting an order |
| `dataclass` | test data with more than a couple of fields; `frozen=True` |
| `NamedTuple` | small immutable records that stay indexable |
| `TypedDict` | a dict whose shape you want checked |
| `Enum` | a closed set of options — filters, roles, environments |
| `re.Pattern` | assertions where an exact string would be brittle |
| `pathlib.Path` | artifact paths |
| `bytes` | `page.screenshot()` with no path |
| generator | fixtures — everything after `yield` is teardown |

The headline: **`dict` is the most common, usually as a `list` of dicts feeding
`@pytest.mark.parametrize`**. For anything past two or three fields prefer a
frozen `dataclass` — a typo in `user["lands_onn"]` is a `KeyError` at runtime
inside the test, while `user.lands_onn` is caught by a type checker before you
run anything.

## Two binding differences found while verifying

**`add_init_script()` takes no argument parameter.** The JavaScript version
accepts a function plus an argument; the Python signature accepts only a script
or a path. The payload has to be serialised into the script text:

```python
page.add_init_script(
    f"window.localStorage.setItem('react-todos', {json.dumps(json.dumps(seeded))})"
)
```

The double `json.dumps` is deliberate — the inner call produces the JSON value,
the outer turns it into a valid JavaScript string literal. This was the one
test that failed on the first run; getting it wrong produces a script that
fails silently inside the page.

**Device descriptors are unpacked as kwargs:** `browser.new_context(**iphone)`.
TypeScript spreads the object into the config instead.

## Not a data structure

`Locator` looks like a collection and is not — it holds no elements, it is a
lazy query that re-resolves on every use. The last two tests in the file show a
locator created before any matching element exists, which later resolves to
one, without the locator object itself changing. `locator.all()` is the
explicit conversion when you need to iterate.
