import { expect, test, type Page } from "@playwright/test";

import { E2E_ADMIN } from "./auth-fixtures";

// Most editor specs need the seeded sample page ("Sample SaaS page") in the
// test database. They skip themselves when it is absent; nothing here seeds or
// modifies the database. These specs only edit in memory and never click Save.
const SAMPLE_PAGE_NAME = "Sample SaaS page";
const MISSING_SAMPLE =
  "The test database has no 'Sample SaaS page'. Seed it (npm run db:seed with the test DATABASE_URL) to run the editor specs.";

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(E2E_ADMIN.email);
  await page.getByLabel("Password").fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/dashboard");
}

/** Opens the sample page's editor from the dashboard, or skips the test. */
async function openSampleEditor(page: Page) {
  await signIn(page);
  // Wait until the dashboard has rendered (its loading skeleton has no <h1>),
  // so the count below never sees the skeleton and skips by mistake.
  await expect(page.getByRole("heading", { level: 1, name: "Pages" })).toBeVisible();
  const editLink = page.getByRole("link", { name: `Edit ${SAMPLE_PAGE_NAME}` });
  test.skip((await editLink.count()) === 0, MISSING_SAMPLE);

  await editLink.click();
  // `next dev` compiles the editor route on first request, which can exceed
  // the default 5s when several workers open it at once on a fresh server.
  await expect(page).toHaveURL(/\/dashboard\/pages\/[^/]+$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { level: 1, name: SAMPLE_PAGE_NAME })).toBeVisible();
}

const outline = (page: Page) => page.getByRole("navigation", { name: "Sections" });
const inspector = (page: Page) => page.getByRole("complementary", { name: "Inspector" });
const preview = (page: Page) => page.getByRole("region", { name: "Preview" });

test("unknown page ids show the not-found page", async ({ page }) => {
  await signIn(page);
  await page.goto("/dashboard/pages/does-not-exist");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to pages" })).toHaveAttribute(
    "href",
    "/dashboard",
  );
});

test.describe("with the sample page", () => {
  test.beforeEach(async ({ page }) => {
    await openSampleEditor(page);
  });

  test("shows the editor layout and is not indexed", async ({ page }) => {
    await expect(page).toHaveTitle(`Edit ${SAMPLE_PAGE_NAME} · Dashboard`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );
    for (const label of ["Hero", "Features", "Testimonials", "Pricing", "FAQ", "Call to action", "Footer"]) {
      await expect(outline(page).getByRole("button", { name: new RegExp(`^${label}`) })).toBeVisible();
    }
    await expect(page.getByText("All changes saved", { exact: true })).toBeVisible();
    await expect(page.getByRole("status").first()).toHaveText("All required content is filled in");
  });

  test("selects sections from the outline and from the preview", async ({ page }) => {
    await outline(page).getByRole("button", { name: /^Pricing/ }).click();
    await expect(inspector(page).getByRole("heading", { name: "Pricing" })).toBeVisible();

    await preview(page).getByRole("button", { name: "Select FAQ section" }).click();
    await expect(inspector(page).getByRole("heading", { name: "FAQ" })).toBeVisible();
    await expect(outline(page).getByRole("button", { name: /^FAQ/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  test("editing a field updates the live preview", async ({ page }) => {
    await outline(page).getByRole("button", { name: /^Hero/ }).click();
    await inspector(page).getByLabel("Heading", { exact: true }).fill("A brand new headline");

    await expect(preview(page).getByText("A brand new headline")).toBeVisible();
    await expect(page.getByText("Unsaved changes", { exact: true })).toBeVisible();
  });

  test("empty required fields are flagged as needed to publish", async ({ page }) => {
    await outline(page).getByRole("button", { name: /^Hero/ }).click();
    const heading = inspector(page).getByLabel("Heading", { exact: true });
    await heading.fill("");

    await expect(inspector(page).getByText("Required to publish")).toBeVisible();
    await expect(heading).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("status").first()).toHaveText("1 needed to publish");
  });

  test("unsafe links are errors", async ({ page }) => {
    await outline(page).getByRole("button", { name: /^Hero/ }).click();
    const primary = inspector(page).getByRole("group", { name: "Primary button" });
    const link = primary.getByLabel("Link");
    await link.fill("javascript:alert(1)");

    await expect(link).toHaveAttribute("aria-invalid", "true");
    await expect(primary.getByText(/^Error: Must be an https:/)).toBeVisible();
    await expect(page.getByRole("status").first()).toHaveText("1 error");
  });

  test("feature items can be added up to the limit and removed", async ({ page }) => {
    await outline(page).getByRole("button", { name: /^Features/ }).click();
    const add = inspector(page).getByRole("button", { name: "Add feature" });

    while (await add.isEnabled()) await add.click();
    await expect(inspector(page).getByText("Maximum of 12 features reached")).toBeVisible();
    await expect(inspector(page).getByRole("group", { name: "Feature 12" })).toBeVisible();

    await inspector(page).getByRole("button", { name: "Remove feature 12" }).click();
    await expect(inspector(page).getByText("11 of 12 features")).toBeVisible();
    await expect(add).toBeEnabled();
  });

  test("sections can be added and removed", async ({ page }) => {
    await outline(page).getByText("Add section").click();
    await outline(page).getByRole("button", { name: "Call to action", exact: true }).click();
    await expect(outline(page).getByRole("button", { name: /^Call to action/ })).toHaveCount(2);
    await expect(inspector(page).getByRole("heading", { name: "Call to action" })).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await inspector(page).getByRole("button", { name: "Remove section" }).click();
    await expect(outline(page).getByRole("button", { name: /^Call to action/ })).toHaveCount(1);
  });

  test("reset restores the loaded content", async ({ page }) => {
    await page.getByRole("button", { name: /^Page settings/ }).click();
    const title = inspector(page).getByLabel("SEO title");
    const original = await title.inputValue();
    await title.fill("Changed title");

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Reset changes" }).click();

    await expect(title).toHaveValue(original);
    await expect(page.getByText("All changes saved", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset changes" })).toBeDisabled();
  });

  test("leaving with unsaved changes asks for confirmation", async ({ page }) => {
    await page.getByRole("button", { name: /^Page settings/ }).click();
    await inspector(page).getByLabel("SEO title").fill("Unsaved title");
    const back = page.getByRole("link", { name: "Pages" });

    page.once("dialog", (dialog) => dialog.dismiss());
    await back.click();
    await expect(page).toHaveURL(/\/dashboard\/pages\//);

    page.once("dialog", (dialog) => dialog.accept());
    await back.click();
    await expect(page).toHaveURL("/dashboard");
  });

  test("closing the tab with unsaved changes triggers beforeunload", async ({ page }) => {
    await page.getByRole("button", { name: /^Page settings/ }).click();
    await inspector(page).getByLabel("SEO title").fill("Unsaved title");

    const dialog = page.waitForEvent("dialog");
    await page.close({ runBeforeUnload: true });
    const beforeUnload = await dialog;
    expect(beforeUnload.type()).toBe("beforeunload");
    await beforeUnload.dismiss();
  });

  test("desktop editor fits the viewport and its columns scroll independently", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const documentFitsViewport = () =>
      page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight);
    const previewColumn = preview(page).locator("xpath=..");

    expect(await documentFitsViewport()).toBe(true);
    expect(await previewColumn.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);

    // Selecting a section far down scrolls only the preview column: the
    // window stays put and the outline and header remain visible.
    await outline(page).getByRole("button", { name: /^Footer/ }).click();
    await expect.poll(() => previewColumn.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(outline(page).getByRole("button", { name: /^Hero/ })).toBeInViewport();
    await expect(page.getByRole("heading", { level: 1, name: SAMPLE_PAGE_NAME })).toBeInViewport();
    expect(await documentFitsViewport()).toBe(true);
  });

  test("switches between edit and preview on small screens without horizontal scroll", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    const toggle = page.getByRole("group", { name: "Editor view" });
    await expect(toggle).toBeVisible();
    await expect(inspector(page)).toBeVisible();

    await toggle.getByRole("button", { name: "Preview" }).click();
    await expect(preview(page)).toBeVisible();
    await expect(inspector(page)).toBeHidden();

    await preview(page).getByRole("button", { name: "Select Pricing section" }).click();
    await expect(inspector(page).getByRole("heading", { name: "Pricing" })).toBeVisible();

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });
});

// Phase 6: top-level section reordering. Real drag events and key presses on
// the handle cannot be exercised in Jest's DOM-less setup, so they are covered
// here. Everything is in editor memory; nothing is saved.
test.describe("section reordering", () => {
  const ORIGINAL = ["hero", "features", "testimonials", "pricing", "faq", "cta", "footer"];

  const handle = (page: Page, label: string) =>
    outline(page).getByRole("button", { name: `Reorder ${label} section` });
  const row = (page: Page, label: string) => handle(page, label).locator("xpath=..");

  const outlineOrder = (page: Page) =>
    outline(page)
      .locator("[data-reorder-handle]")
      .evaluateAll((els) => els.map((el) => el.getAttribute("data-reorder-handle")));
  const previewOrder = (page: Page) =>
    preview(page)
      .locator("[data-section-id]")
      .evaluateAll((els) => els.map((el) => el.getAttribute("data-section-id")));

  async function expectOrder(page: Page, ids: string[]) {
    await expect.poll(() => outlineOrder(page)).toEqual(ids);
    await expect.poll(() => previewOrder(page)).toEqual(ids);
  }

  /** Drags a section's handle onto the top or bottom edge of another row. */
  async function dragSection(page: Page, from: string, to: string, placement: "before" | "after") {
    const target = row(page, to);
    const box = await target.boundingBox();
    if (!box) throw new Error(`no row for ${to}`);
    await handle(page, from).dragTo(target, {
      targetPosition: { x: box.width / 2, y: placement === "before" ? 3 : box.height - 3 },
    });
  }

  const announcement = (page: Page) => page.getByTestId("reorder-announcement");

  test.beforeEach(async ({ page }) => {
    await openSampleEditor(page);
    await expectOrder(page, ORIGINAL);
  });

  test("dragging a section above another moves it up", async ({ page }) => {
    await dragSection(page, "Pricing", "Hero", "before");

    await expectOrder(page, ["pricing", "hero", "features", "testimonials", "faq", "cta", "footer"]);
    await expect(announcement(page)).toHaveText("Pricing moved to position 1 of 7.");
    await expect(page.getByText("Unsaved changes", { exact: true })).toBeVisible();
  });

  test("dragging a section below another moves it down", async ({ page }) => {
    await dragSection(page, "Hero", "FAQ", "after");

    await expectOrder(page, ["features", "testimonials", "pricing", "faq", "hero", "cta", "footer"]);
    await expect(announcement(page)).toHaveText("Hero moved to position 5 of 7.");
  });

  test("the selected section stays selected, with its content, after another section moves", async ({
    page,
  }) => {
    await outline(page).getByRole("button", { name: /^FAQ/ }).click();
    const heading = inspector(page).getByLabel("Heading", { exact: true });
    const before = await heading.inputValue();

    await dragSection(page, "Footer", "Hero", "before");

    await expectOrder(page, ["footer", "hero", "features", "testimonials", "pricing", "faq", "cta"]);
    await expect(outline(page).getByRole("button", { name: /^FAQ/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(inspector(page).getByRole("heading", { name: "FAQ" })).toBeVisible();
    await expect(inspector(page).getByText("Position 6 of 7")).toBeVisible();
    await expect(heading).toHaveValue(before);
  });

  test("dropping outside the list or onto itself changes nothing", async ({ page }) => {
    await handle(page, "Pricing").dragTo(preview(page));
    await dragSection(page, "Pricing", "Pricing", "after");

    await expectOrder(page, ORIGINAL);
    await expect(page.getByText("All changes saved", { exact: true })).toBeVisible();
  });

  test("reset restores the original order", async ({ page }) => {
    await dragSection(page, "Call to action", "Hero", "before");
    await expectOrder(page, ["cta", "hero", "features", "testimonials", "pricing", "faq", "footer"]);

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Reset changes" }).click();

    await expectOrder(page, ORIGINAL);
    await expect(page.getByText("All changes saved", { exact: true })).toBeVisible();
  });

  test("the handle reorders with the keyboard and keeps focus", async ({ page }) => {
    const heroHandle = handle(page, "Hero");
    await heroHandle.focus();

    await page.keyboard.press("ArrowDown");
    await expectOrder(page, ["features", "hero", "testimonials", "pricing", "faq", "cta", "footer"]);
    await expect(announcement(page)).toHaveText("Hero moved to position 2 of 7.");
    await expect(heroHandle).toBeFocused();

    await page.keyboard.press("End");
    await expectOrder(page, ["features", "testimonials", "pricing", "faq", "cta", "footer", "hero"]);
    await expect(heroHandle).toBeFocused();

    await page.keyboard.press("ArrowDown"); // already last: no change
    await page.keyboard.press("Home");
    await expectOrder(page, ORIGINAL);
    await expect(page.getByText("All changes saved", { exact: true })).toBeVisible();
  });

  test("Move up and Move down reorder the selected section", async ({ page }) => {
    await outline(page).getByRole("button", { name: /^Pricing/ }).click();
    // Chrome computes "Move up : Pricing section" (the visually hidden span
    // adds whitespace), so allow optional space before the colon.
    const up = inspector(page).getByRole("button", { name: /^Move up\s*: Pricing section$/ });
    const down = inspector(page).getByRole("button", { name: /^Move down\s*: Pricing section$/ });

    await up.click();
    await expectOrder(page, ["hero", "features", "pricing", "testimonials", "faq", "cta", "footer"]);
    await expect(inspector(page).getByText("Position 3 of 7")).toBeVisible();
    await expect(announcement(page)).toHaveText("Pricing moved to position 3 of 7.");

    await up.click();
    await up.click();
    await expect(inspector(page).getByText("Position 1 of 7")).toBeVisible();
    await expect(up).toBeDisabled();
    // Focus moves to the other button instead of being lost on the disabled one.
    await expect(down).toBeFocused();

    await down.click();
    await down.click();
    await down.click();
    await expectOrder(page, ORIGINAL);
    await expect(inspector(page).getByRole("heading", { name: "Pricing" })).toBeVisible();
    await expect(page.getByText("All changes saved", { exact: true })).toBeVisible();
  });
});
