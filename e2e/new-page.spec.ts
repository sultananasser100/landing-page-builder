import { expect, test, type Page } from "@playwright/test";

import { signIn } from "./helpers";
import { E2E_CREATED_SLUG_PREFIX } from "./test-database";

// Creating a page from a template, end to end. Runs against the test database
// (see e2e/global-setup.ts) but does not depend on any fixture page: each test
// creates its own page with a slug unique to the run. Every slug starts with
// E2E_CREATED_SLUG_PREFIX, and global setup deletes pages with that prefix
// before the next run.

const RUN_ID = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

async function openNewPageForm(page: Page) {
  await signIn(page);
  await page.getByRole("link", { name: "New page" }).click();
  await expect(page).toHaveURL("/dashboard/pages/new");
  await expect(page.getByRole("heading", { level: 1, name: "New page" })).toBeVisible();
}

test("creating a page from the SaaS template lands in the editor with its sections", async ({
  page,
}) => {
  await openNewPageForm(page);

  const name = `E2E SaaS ${RUN_ID}`;
  const slug = `${E2E_CREATED_SLUG_PREFIX}saas-${RUN_ID}`;
  await page.getByLabel("Page name").fill(name);
  // The slug field auto-fills from the name; overwrite it with the exact slug.
  await page.getByLabel("URL slug").fill(slug);
  await page.getByRole("radio", { name: /^SaaS landing page/ }).check();
  await page.getByRole("button", { name: "Create page" }).click();

  await expect(page).toHaveURL(/\/dashboard\/pages\/[^/]+$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  const sections = page.getByRole("navigation", { name: "Sections" });
  for (const label of ["Hero", "Features", "Testimonials", "Pricing", "FAQ", "Footer"]) {
    await expect(sections.getByRole("button", { name: new RegExp(`^${label}`) })).toBeVisible();
  }

  // The new page shows up on the dashboard as a draft.
  await page.goto("/dashboard");
  const row = page.getByRole("listitem").filter({ hasText: name });
  await expect(row).toBeVisible();
  await expect(row.locator('[data-slot="badge"]')).toHaveText("Draft");
  await expect(row).toContainText(`/p/${slug}`);
});

test("creating a page from the Blank template starts with no sections", async ({ page }) => {
  await openNewPageForm(page);

  const name = `E2E Blank ${RUN_ID}`;
  const slug = `${E2E_CREATED_SLUG_PREFIX}blank-${RUN_ID}`;
  await page.getByLabel("Page name").fill(name);
  await page.getByLabel("URL slug").fill(slug);
  // Blank is the default selection; no radio click needed.
  await page.getByRole("button", { name: "Create page" }).click();

  await expect(page).toHaveURL(/\/dashboard\/pages\/[^/]+$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Sections" }).getByText("No sections yet."),
  ).toBeVisible();
});

test("the slug is prefilled from the name until it is edited by hand", async ({ page }) => {
  await openNewPageForm(page);
  const nameField = page.getByLabel("Page name");
  const slugField = page.getByLabel("URL slug");

  await nameField.fill("Summer Sale 2026!");
  await expect(slugField).toHaveValue("summer-sale-2026");

  await nameField.fill("Winter Sale");
  await expect(slugField).toHaveValue("winter-sale");

  // Once edited manually, the slug no longer follows the name.
  await slugField.fill("my-own-slug");
  await nameField.fill("Spring Sale");
  await expect(slugField).toHaveValue("my-own-slug");
});

test("an empty name is stopped by the browser's required-field validation", async ({ page }) => {
  await openNewPageForm(page);
  const nameField = page.getByLabel("Page name");

  // Only the slug is filled in, so the name is the missing required field.
  await page.getByLabel("URL slug").fill("name-is-missing");
  await page.getByRole("button", { name: "Create page" }).click();

  // The form is not submitted: no navigation and no server error is shown.
  await expect(page).toHaveURL("/dashboard/pages/new");
  await expect(nameField).toBeFocused();
  expect(await nameField.evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(
    true,
  );
  await expect(page.locator("#name-error")).toHaveCount(0);
});

test("a name of only spaces shows the name error and does not create a page", async ({
  page,
}) => {
  await openNewPageForm(page);

  // Spaces satisfy the browser's `required` check, so the server rejects them.
  await page.getByLabel("Page name").fill("   ");
  await page.getByLabel("URL slug").fill("spaces-only-name");
  await page.getByRole("button", { name: "Create page" }).click();

  await expect(page.locator("#name-error")).toHaveText("Enter a page name.");
  await expect(page.getByLabel("Page name")).toHaveAttribute("aria-invalid", "true");
  await expect(page).toHaveURL("/dashboard/pages/new");
});

test("an invalid slug shows the slug error and keeps what was typed", async ({ page }) => {
  await openNewPageForm(page);

  await page.getByLabel("Page name").fill("E2E invalid slug");
  await page.getByLabel("URL slug").fill("Bad Slug!");
  await page.getByRole("button", { name: "Create page" }).click();

  // The slug pattern is enforced on the server and reported on the field.
  await expect(page.locator("#slug-error")).toHaveText(
    "Use only lowercase letters, digits and hyphens.",
  );
  await expect(page.getByLabel("URL slug")).toHaveAttribute("aria-invalid", "true");
  await expect(page).toHaveURL("/dashboard/pages/new");
  await expect(page.getByLabel("Page name")).toHaveValue("E2E invalid slug");
  await expect(page.getByLabel("URL slug")).toHaveValue("Bad Slug!");
  await expect(page.locator("#name-error")).toHaveCount(0);
});

test("a duplicate slug shows a field error and does not navigate away", async ({ page }) => {
  await openNewPageForm(page);

  const name = `E2E Dup ${RUN_ID}`;
  const slug = `${E2E_CREATED_SLUG_PREFIX}dup-${RUN_ID}`;
  await page.getByLabel("Page name").fill(name);
  await page.getByLabel("URL slug").fill(slug);
  await page.getByRole("button", { name: "Create page" }).click();
  await expect(page).toHaveURL(/\/dashboard\/pages\/[^/]+$/, { timeout: 15_000 });

  await openNewPageForm(page);
  await page.getByLabel("Page name").fill(`${name} again`);
  await page.getByLabel("URL slug").fill(slug);
  await page.getByRole("button", { name: "Create page" }).click();

  await expect(page).toHaveURL("/dashboard/pages/new");
  // Scoped to the slug field: Next's route announcer is also role="alert".
  await expect(page.locator("#slug-error")).toContainText("already in use");
  await expect(page.getByLabel("URL slug")).toHaveAttribute("aria-invalid", "true");
});

test("fits a phone-width viewport without horizontal scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await openNewPageForm(page);

  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflows).toBe(false);
});

test("a Hero link to #features scrolls to the Features section on the published page", async ({
  page,
}) => {
  await openNewPageForm(page);
  const name = `E2E Anchors ${RUN_ID}`;
  const slug = `${E2E_CREATED_SLUG_PREFIX}anchors-${RUN_ID}`;
  await page.getByLabel("Page name").fill(name);
  await page.getByLabel("URL slug").fill(slug);
  await page.getByRole("radio", { name: /^SaaS landing page/ }).check();
  await page.getByRole("button", { name: "Create page" }).click();
  await expect(page).toHaveURL(/\/dashboard\/pages\/[^/]+$/, { timeout: 15_000 });

  const inspector = page.getByRole("complementary", { name: "Inspector" });

  // Required for publishing; the template leaves the page meta empty.
  await page.getByRole("button", { name: /^Page settings/ }).click();
  await inspector.getByLabel("SEO title").fill("Anchor test");
  await inspector.getByLabel("SEO description").fill("Anchor test page");

  // Point the Hero's primary button at the Features section.
  await page
    .getByRole("navigation", { name: "Sections" })
    .getByRole("button", { name: /^Hero/ })
    .click();
  await inspector.getByRole("group", { name: "Primary button" }).getByLabel("Link").fill("#features");

  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByTestId("action-feedback")).toContainText("Saved at");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByTestId("action-feedback")).toContainText("Published at");

  // The editor preview uses the same anchors as the public page.
  await expect(page.locator("#features")).toHaveCount(1);

  await page.goto(`/p/${slug}`);
  const features = page.locator("section#features");
  await expect(features).toHaveCount(1);
  // The default Hero is short, so Features may already be partly visible; what
  // matters is that the page starts at the top and the click scrolls it.
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  await page.locator('a[href="#features"]').first().click();

  await expect(page).toHaveURL(new RegExp(`/p/${slug}#features$`));
  await expect(features).toBeInViewport();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  // The browser aligned the Features section's top edge with the viewport top.
  await expect
    .poll(() => features.evaluate((element) => Math.round(element.getBoundingClientRect().top)))
    .toBeLessThanOrEqual(1);
});
