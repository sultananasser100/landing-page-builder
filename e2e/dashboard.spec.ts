import { expect, test, type Page } from "@playwright/test";

import { signIn } from "./helpers";
import { E2E_PAGES } from "./test-database";

// Global setup (e2e/reset-fixtures.ts) always seeds the published sample page,
// so these specs assert on it directly. Other pages may also be listed, so
// nothing here depends on the total number of pages.
const SAMPLE = E2E_PAGES.sample;

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

const sampleRow = (page: Page) =>
  page.getByRole("listitem").filter({ hasText: SAMPLE.name });

test("shows the pages workspace with the seeded sample page", async ({ page }) => {
  await expect(page).toHaveTitle("Pages · Dashboard");
  await expect(page.getByRole("heading", { level: 1, name: "Pages" })).toBeVisible();

  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "Landing Page Builder" })).toHaveAttribute(
    "href",
    "/dashboard",
  );
  await expect(header.getByRole("button", { name: "Sign out" })).toBeVisible();
  await expect(page.getByRole("link", { name: "New page" })).toHaveAttribute(
    "href",
    "/dashboard/pages/new",
  );

  await expect(page.getByRole("heading", { name: "No pages yet" })).toHaveCount(0);
  await expect(page.getByText(/^\d+ pages? · \d+ published$/)).toBeVisible();

  const row = sampleRow(page);
  await expect(row).toHaveCount(1);
  await expect(row.getByRole("heading", { level: 2, name: SAMPLE.name })).toBeVisible();
  await expect(row.locator('[data-slot="badge"]')).toHaveText("Published");
  await expect(row).toContainText(`/p/${SAMPLE.slug}`);
  await expect(row.getByRole("link", { name: `Edit ${SAMPLE.name}` })).toHaveAttribute(
    "href",
    /^\/dashboard\/pages\/[^/]+$/,
  );
});

test("is not indexed", async ({ page }) => {
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
});

test("the sample page's live link opens the public page in a new tab", async ({ page }) => {
  const liveLink = sampleRow(page).getByRole("link", { name: /^View live/ });
  await expect(liveLink).toHaveAttribute("href", `/p/${SAMPLE.slug}`);
  await expect(liveLink).toHaveAttribute("target", "_blank");
  await expect(liveLink).toHaveAttribute("rel", "noopener noreferrer");
});

test("every live link points at a public page and opens in a new tab", async ({ page }) => {
  // `count()` does not wait, so first wait for the list to render (the loading
  // skeleton has no rows).
  await expect(sampleRow(page)).toBeVisible();
  const liveLinks = page.getByRole("link", { name: /^View live/ });
  expect(await liveLinks.count()).toBeGreaterThan(0);
  for (const link of await liveLinks.all()) {
    await expect(link).toHaveAttribute("href", /^\/p\//);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
});

test("fits a phone-width viewport without horizontal scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.reload();

  await expect(page.getByRole("heading", { level: 1, name: "Pages" })).toBeVisible();
  await expect(sampleRow(page)).toBeVisible();
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflows).toBe(false);
});
