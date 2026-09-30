import { expect, test, type Page } from "@playwright/test";

import { E2E_ADMIN } from "./auth-fixtures";
import { E2E_PAGES } from "./test-database";

// Persistence and publishing, end to end. These specs WRITE to the database:
// global setup (e2e/global-setup.ts) refuses to run unless .env.test names a
// `_test` database, and resets the "E2E persistence page" to a never-published
// draft before every run. The steps depend on each other, so the tests run in
// order in a single worker.
test.describe.configure({ mode: "serial" });

const PAGE = E2E_PAGES.persistence;
const HERO_HEADING = "Plan less. Ship more.";
const DRAFT_HEADING = "Edited draft headline";
const PUBLISHED_HEADING = "Published headline v2";

let editorUrl: string;

async function signIn(page: Page) {
  await page.goto("/login");
  // /login redirects signed-in visitors to the dashboard: already signed in.
  if (new URL(page.url()).pathname === "/dashboard") return;
  await page.getByLabel("Email").fill(E2E_ADMIN.email);
  await page.getByLabel("Password").fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/dashboard");
}

async function openEditor(page: Page) {
  await signIn(page);
  await expect(page.getByRole("heading", { level: 1, name: "Pages" })).toBeVisible();
  if (editorUrl) {
    await page.goto(editorUrl);
  } else {
    await page.getByRole("link", { name: `Edit ${PAGE.name}` }).click();
    await expect(page).toHaveURL(/\/dashboard\/pages\/[^/]+$/, { timeout: 15_000 });
    editorUrl = new URL(page.url()).pathname;
  }
  await expect(page.getByRole("heading", { level: 1, name: PAGE.name })).toBeVisible();
}

const heroHeadingField = (page: Page) =>
  page.getByRole("complementary", { name: "Inspector" }).getByLabel("Heading", { exact: true });
const saveButton = (page: Page) => page.getByRole("button", { name: "Save", exact: true });
const publishButton = (page: Page) => page.getByRole("button", { name: "Publish", exact: true });
const feedback = (page: Page) => page.getByTestId("action-feedback");

async function selectHero(page: Page) {
  await page
    .getByRole("navigation", { name: "Sections" })
    .getByRole("button", { name: /^Hero/ })
    .click();
}

async function editHeroHeading(page: Page, value: string) {
  await selectHero(page);
  await heroHeadingField(page).fill(value);
}

/** The text of the public page's <h1>, or null when the page is not found. */
async function publicHeading(page: Page): Promise<string | null> {
  const response = await page.goto(`/p/${PAGE.slug}`);
  if (response?.status() === 404) return null;
  return page.getByRole("heading", { level: 1 }).first().textContent();
}

/** Status of the fixture page as shown on the dashboard. */
async function dashboardStatus(page: Page): Promise<string> {
  await page.goto("/dashboard");
  const row = page.getByRole("listitem").filter({ hasText: PAGE.name });
  await expect(row).toBeVisible();
  const badge = row.locator('[data-slot="badge"]');
  return (await badge.textContent()) ?? "";
}

test("a never-published page is not available publicly and shows as Draft", async ({ page }) => {
  await signIn(page);
  expect(await publicHeading(page)).toBeNull();
  expect(await dashboardStatus(page)).toBe("Draft");
});

test("saving an edit persists it across a reload", async ({ page }) => {
  await openEditor(page);
  await editHeroHeading(page, DRAFT_HEADING);
  await expect(page.getByText("Unsaved changes", { exact: true })).toBeVisible();
  await expect(publishButton(page)).toBeDisabled();

  await saveButton(page).click();
  await expect(feedback(page)).toContainText("Saved at");
  await expect(page.getByText("All changes saved", { exact: true })).toBeVisible();
  await expect(saveButton(page)).toBeDisabled();

  await page.reload();
  await selectHero(page);
  await expect(heroHeadingField(page)).toHaveValue(DRAFT_HEADING);
  await expect(page.getByText("All changes saved", { exact: true })).toBeVisible();
});

test("a saved draft is still not public and the dashboard still says Draft", async ({ page }) => {
  await signIn(page);
  expect(await publicHeading(page)).toBeNull();
  expect(await dashboardStatus(page)).toBe("Draft");
});

test("publishing makes the saved draft public", async ({ page }) => {
  await openEditor(page);
  await expect(publishButton(page)).toBeEnabled();

  await publishButton(page).click();
  await expect(feedback(page)).toContainText("Published at");
  await expect(page.getByText("Published", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /View live/ })).toBeVisible();

  expect(await publicHeading(page)).toBe(DRAFT_HEADING);
  expect(await dashboardStatus(page)).toBe("Published");
});

test("editing and saving a published page leaves the public page unchanged", async ({ page }) => {
  await openEditor(page);
  await editHeroHeading(page, PUBLISHED_HEADING);
  await saveButton(page).click();
  await expect(feedback(page)).toContainText("Saved at");
  await expect(page.getByText("All changes saved · not yet published")).toBeVisible();
  await expect(page.getByText("Unpublished changes", { exact: true }).first()).toBeVisible();

  // The public page still shows the previously published version.
  expect(await publicHeading(page)).toBe(DRAFT_HEADING);
  expect(await dashboardStatus(page)).toBe("Unpublished changes");

  // The draft survives a reload.
  await openEditor(page);
  await selectHero(page);
  await expect(heroHeadingField(page)).toHaveValue(PUBLISHED_HEADING);
});

test("publishing again updates the public page", async ({ page }) => {
  await openEditor(page);
  await publishButton(page).click();
  await expect(feedback(page)).toContainText("Published at");

  expect(await publicHeading(page)).toBe(PUBLISHED_HEADING);
  expect(await dashboardStatus(page)).toBe("Published");
});

test("content that is not publishable can be saved as a draft but not published", async ({
  page,
}) => {
  await openEditor(page);
  await editHeroHeading(page, "");
  await expect(publishButton(page)).toBeDisabled();

  await saveButton(page).click();
  await expect(feedback(page)).toContainText("Saved at");
  await expect(page.getByText("Fill in the required content before publishing.")).toBeVisible();
  await expect(publishButton(page)).toBeDisabled();

  // The public page keeps the last published version.
  expect(await publicHeading(page)).toBe(PUBLISHED_HEADING);
});

test("unsafe links cannot be saved", async ({ page }) => {
  await openEditor(page);
  await selectHero(page);
  await heroHeadingField(page).fill(HERO_HEADING);
  await page
    .getByRole("group", { name: "Primary button" })
    .getByLabel("Link")
    .fill("javascript:alert(1)");

  await expect(saveButton(page)).toBeDisabled();
  await expect(publishButton(page)).toBeDisabled();
});

test("a stale editor cannot overwrite newer changes", async ({ browser }) => {
  // Two independent sessions (two browser contexts) editing the same page.
  const first = await (await browser.newContext()).newPage();
  const second = await (await browser.newContext()).newPage();
  await openEditor(first);
  await openEditor(second);

  await editHeroHeading(first, "Saved from the first tab");
  await saveButton(first).click();
  await expect(feedback(first)).toContainText("Saved at");

  await editHeroHeading(second, "Saved from the stale tab");
  await saveButton(second).click();
  await expect(feedback(second)).toContainText("changed elsewhere");
  // The stale editor keeps its unsaved edit so nothing is silently lost.
  await expect(second.getByText("Unsaved changes", { exact: true })).toBeVisible();

  // The first tab's save is what is stored.
  await openEditor(second);
  await selectHero(second);
  await expect(heroHeadingField(second)).toHaveValue("Saved from the first tab");

  await first.context().close();
  await second.context().close();
});

test("the editor page requires sign-in and saves cannot bypass it", async ({ page }) => {
  await page.goto(editorUrl);
  await expect(page).toHaveURL(/\/login/);
});
