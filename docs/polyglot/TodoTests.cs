/*
 * .NET (C#) / NUnit.
 *
 *   dotnet new nunit -n PlaywrightTests
 *   cd PlaywrightTests
 *   dotnet add package Microsoft.Playwright.NUnit
 *   dotnet build
 *   pwsh bin/Debug/net9.0/playwright.ps1 install chromium
 *   dotnet test
 *
 * Inheriting PageTest supplies the Page property and the browser lifecycle, and
 * brings Expect() into scope — the retrying assertion. NUnit's Assert.That
 * would not retry.
 *
 * Everything is async: the API is Task-based, so each call is awaited and the
 * assertion helpers are the ...Async variants.
 */
using System.Threading.Tasks;
using Microsoft.Playwright;
using Microsoft.Playwright.NUnit;
using NUnit.Framework;

namespace PlaywrightTests;

[Parallelizable(ParallelScope.Self)]
[TestFixture]
public class TodoTests : PageTest
{
    [Test]
    public async Task AddingATodoShowsItInTheList()
    {
        await Page.GotoAsync("https://demo.playwright.dev/todomvc/");

        var newTodo = Page.GetByPlaceholder("What needs to be done?");
        await newTodo.FillAsync("write a test");
        await newTodo.PressAsync("Enter");

        await Expect(Page.GetByTestId("todo-item")).ToHaveCountAsync(1);
        await Expect(Page.GetByTestId("todo-title")).ToHaveTextAsync("write a test");
    }
}
