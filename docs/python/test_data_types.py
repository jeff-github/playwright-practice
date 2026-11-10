"""
The data types that actually show up in Playwright Python tests.

Every test here runs. Run them with:

    pytest test_data_types.py -v

Targets: the TodoMVC demo app and jsonplaceholder, both public and stable.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Iterator, NamedTuple, TypedDict

import pytest
from playwright.sync_api import APIRequestContext, Browser, Page, Playwright, expect

TODOMVC = "https://demo.playwright.dev/todomvc/"
API = "https://jsonplaceholder.typicode.com"


def add_todo(page: Page, title: str) -> None:
    """One user intention, so the tests below stay about the data."""
    box = page.get_by_placeholder("What needs to be done?")
    box.fill(title)
    box.press("Enter")


# ---------------------------------------------------------------- dict
# The most common structure in a Playwright Python suite.


def test_dict_as_an_api_payload(page: Page) -> None:
    payload: dict[str, object] = {"title": "flake triage", "body": "trace first", "userId": 7}

    response = page.request.post(f"{API}/posts", data=payload)

    assert response.status == 201
    created = response.json()          # .json() hands you a dict
    assert isinstance(created, dict)
    assert created["title"] == payload["title"]


def test_dict_as_a_stubbed_response(page: Page) -> None:
    profile = {"name": "Ada Lovelace", "plan": "enterprise"}

    # route.fulfill takes a string body, so the dict is dumped to JSON.
    page.route(
        "**/api/profile",
        lambda route: route.fulfill(
            status=200, content_type="application/json", body=json.dumps(profile)
        ),
    )

    page.goto(TODOMVC)
    got = page.evaluate("async () => (await fetch('/api/profile')).json()")
    assert got == profile


def test_storage_state_is_a_dict(page: Page) -> None:
    page.goto(TODOMVC)
    add_todo(page, "persisted")

    state = page.context.storage_state()

    assert isinstance(state, dict)
    assert set(state.keys()) == {"cookies", "origins"}
    assert isinstance(state["cookies"], list)


def test_device_descriptor_is_a_dict_unpacked_as_kwargs(
    playwright: Playwright, browser: Browser
) -> None:
    iphone = playwright.devices["iPhone 13"]
    assert isinstance(iphone, dict)
    assert "viewport" in iphone and "user_agent" in iphone

    # The Python-specific idiom: ** unpacking. No equivalent in the TS binding.
    context = browser.new_context(**iphone)
    page = context.new_page()
    page.goto(TODOMVC)
    assert page.viewport_size == iphone["viewport"]
    context.close()


# ---------------------------------------------------------------- list


def test_list_asserts_order_and_count_together(page: Page) -> None:
    page.goto(TODOMVC)
    for title in ("alpha", "beta", "gamma"):
        add_todo(page, title)

    # The list form checks contents AND order AND length in one retrying call.
    expect(page.get_by_test_id("todo-title")).to_have_text(["alpha", "beta", "gamma"])


def test_all_text_contents_returns_a_plain_list(page: Page) -> None:
    page.goto(TODOMVC)
    for title in ("alpha", "beta"):
        add_todo(page, title)

    titles = page.get_by_test_id("todo-title").all_text_contents()

    assert isinstance(titles, list)
    assert titles == ["alpha", "beta"]


# ---------------------------------------------------------------- tuple


@pytest.mark.parametrize(
    "title,expected_counter",
    [
        ("one thing", "1 item left"),
        ("another thing", "1 item left"),
    ],
)
def test_tuple_parametrization(page: Page, title: str, expected_counter: str) -> None:
    page.goto(TODOMVC)
    add_todo(page, title)
    expect(page.locator(".todo-count")).to_have_text(expected_counter)


# ---------------------------------------------------------------- set


def test_set_for_an_unordered_comparison(page: Page) -> None:
    page.goto(TODOMVC)
    add_todo(page, "something")

    filters = page.locator(".filters").get_by_role("link").all_text_contents()

    # A set says "these three exist" without asserting an order the
    # requirement never specified.
    assert set(filters) == {"All", "Active", "Completed"}


# ---------------------------------------------------------------- dataclass


@dataclass(frozen=True)
class User:
    """frozen=True matters: a mutable record shared across parametrized
    cases is a real source of cross-test contamination under xdist."""

    name: str
    expect_error: str | None = None


USERS = [
    User("standard_user"),
    User("locked_out_user", expect_error="locked out"),
]


@pytest.mark.parametrize("user", USERS, ids=lambda u: u.name)
def test_dataclass_as_test_data(page: Page, user: User) -> None:
    # user.nmae would be caught by a type checker; user["nmae"] would not.
    assert isinstance(user.name, str)
    assert user.expect_error is None or isinstance(user.expect_error, str)


# ---------------------------------------------------------------- NamedTuple


class Price(NamedTuple):
    amount: float
    currency: str


def test_namedtuple_is_a_tuple_with_names(page: Page) -> None:
    total = Price(29.99, "USD")

    assert total.amount == 29.99
    assert total[1] == "USD"          # still indexable
    assert tuple(total) == (29.99, "USD")

    # Money compared in cents, never as floats.
    assert round(total.amount * 100) == 2999


# ---------------------------------------------------------------- TypedDict


class TodoRecord(TypedDict):
    id: str
    title: str
    completed: bool


def test_typeddict_is_a_dict_with_a_checked_shape(page: Page) -> None:
    seeded: list[TodoRecord] = [
        {"id": "seed-1", "title": "seeded one", "completed": False},
        {"id": "seed-2", "title": "seeded two", "completed": True},
    ]

    # Binding difference worth knowing: unlike the JS version, Python's
    # add_init_script() takes no `arg` parameter — it accepts only a script or
    # a path. So the payload is serialised into the script text itself. The
    # double json.dumps is deliberate: the inner one makes the JSON value, the
    # outer one makes that value a valid JavaScript string literal.
    page.add_init_script(
        f"window.localStorage.setItem('react-todos', {json.dumps(json.dumps(seeded))})"
    )
    page.goto(TODOMVC)

    expect(page.get_by_test_id("todo-item")).to_have_count(2)
    assert isinstance(seeded[0], dict)      # TypedDict is a dict at runtime


# ---------------------------------------------------------------- Enum


class Filter(str, Enum):
    ALL = "All"
    ACTIVE = "Active"
    COMPLETED = "Completed"


@pytest.mark.parametrize("choice", list(Filter), ids=lambda f: f.value)
def test_enum_for_a_closed_set_of_options(page: Page, choice: Filter) -> None:
    page.goto(TODOMVC)
    add_todo(page, "a task")

    page.locator(".filters").get_by_role("link", name=choice.value).click()

    # str-mixin Enum: the member is usable directly as a string.
    expect(page).to_have_url(re.compile(r"todomvc"))
    assert isinstance(choice.value, str)


# ---------------------------------------------------------------- re.Pattern


def test_regex_where_an_exact_string_would_be_brittle(page: Page) -> None:
    page.goto(TODOMVC)
    add_todo(page, "a task")

    # Assertions accept a compiled pattern wherever they accept a string.
    expect(page.locator(".todo-count")).to_have_text(re.compile(r"1 item left"))
    expect(page).to_have_title(re.compile(r"TodoMVC", re.IGNORECASE))


# ---------------------------------------------------------------- Path / bytes


def test_path_for_artifacts_and_bytes_for_the_image(page: Page, tmp_path: Path) -> None:
    page.goto(TODOMVC)

    shot_path = tmp_path / "todomvc.png"
    page.screenshot(path=shot_path)          # accepts a pathlib.Path
    assert shot_path.exists()
    assert shot_path.stat().st_size > 0

    raw = page.screenshot()                  # returns bytes when no path given
    assert isinstance(raw, bytes)
    assert raw[:8] == b"\x89PNG\r\n\x1a\n"   # PNG magic number


# ---------------------------------------------------------------- generator


@pytest.fixture
def seeded_page(page: Page) -> Iterator[Page]:
    """A fixture is a generator: everything after yield is teardown, and it
    runs whether the test passed or failed."""
    page.goto(TODOMVC)
    add_todo(page, "from the fixture")
    yield page
    page.evaluate("() => window.localStorage.clear()")


def test_generator_fixture(seeded_page: Page) -> None:
    expect(seeded_page.get_by_test_id("todo-item")).to_have_count(1)


# ---------------------------------------------------------------- not a structure


def test_locator_is_lazy_not_a_collection(page: Page) -> None:
    page.goto(TODOMVC)
    items = page.get_by_test_id("todo-item")

    # Created before anything exists, and it holds no elements.
    assert items.count() == 0

    add_todo(page, "appeared later")

    # The same object now resolves to one element. It was never a list.
    assert items.count() == 1
    resolved = items.all()               # the explicit conversion to a list
    assert isinstance(resolved, list)
    assert len(resolved) == 1


def test_api_request_context_is_not_a_page(page: Page) -> None:
    ctx: APIRequestContext = page.request
    body = ctx.get(f"{API}/posts/1").json()
    assert isinstance(body, dict)
    assert body["id"] == 1
