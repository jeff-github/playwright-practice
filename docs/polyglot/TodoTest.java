/*
 * Java / JUnit 5.
 *
 * pom.xml needs:
 *   com.microsoft.playwright:playwright:1.49.0
 *   org.junit.jupiter:junit-jupiter:5.11.3
 * Then:
 *   mvn test
 *   mvn exec:java -e -D exec.mainClass=com.microsoft.playwright.CLI -D exec.args="install chromium"
 *
 * @UsePlaywright is the JUnit 5 integration: it manages the browser lifecycle
 * and injects Page into the test method, so there is no manual
 * Playwright.create() / browser.close() boilerplate.
 *
 * assertThat(...) from PlaywrightAssertions is the retrying assertion — the
 * equivalent of expect() elsewhere. A plain JUnit assertEquals would not retry.
 */
package com.example.tests;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.junit.UsePlaywright;
import org.junit.jupiter.api.Test;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

@UsePlaywright
public class TodoTest {

    @Test
    void addingATodoShowsItInTheList(Page page) {
        page.navigate("https://demo.playwright.dev/todomvc/");

        Locator newTodo = page.getByPlaceholder("What needs to be done?");
        newTodo.fill("write a test");
        newTodo.press("Enter");

        assertThat(page.getByTestId("todo-item")).hasCount(1);
        assertThat(page.getByTestId("todo-title")).hasText("write a test");
    }
}
