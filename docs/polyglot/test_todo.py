"""
Python / pytest-playwright.

    pip install pytest-playwright
    playwright install chromium
    pytest

The `page` fixture comes from pytest-playwright. Note `expect` is imported from
playwright.sync_api — it is the retrying assertion, the direct equivalent of
expect() in @playwright/test. Plain `assert` would not retry.
"""

from playwright.sync_api import Page, expect


def test_adding_a_todo_shows_it_in_the_list(page: Page) -> None:
    page.goto("https://demo.playwright.dev/todomvc/")

    new_todo = page.get_by_placeholder("What needs to be done?")
    new_todo.fill("write a test")
    new_todo.press("Enter")

    expect(page.get_by_test_id("todo-item")).to_have_count(1)
    expect(page.get_by_test_id("todo-title")).to_have_text("write a test")
