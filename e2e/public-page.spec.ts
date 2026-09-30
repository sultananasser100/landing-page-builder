import { expect, test } from "@playwright/test";

import { samplePageContent } from "../src/features/sections/sample-page";
import { E2E_PAGES } from "./test-database";

// The public route, checked against the seeded sample page: global setup
// (e2e/reset-fixtures.ts) publishes `samplePageContent` at /p/sample, so its
// stored metadata is the expected result. No sign-in is needed.
const SAMPLE = E2E_PAGES.sample;

test("the published page's title and description are its stored metadata", async ({ page }) => {
  await page.goto(`/p/${SAMPLE.slug}`);

  await expect(page).toHaveTitle(samplePageContent.meta.title);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    samplePageContent.meta.description,
  );
});

test("the published page fits a phone-width viewport without horizontal scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(`/p/${SAMPLE.slug}`);

  // Content is present, so the check below is not run against an empty page.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("section#pricing")).toHaveCount(1);
  await expect(page.locator("footer#footer")).toHaveCount(1);

  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflows).toBe(false);
});
