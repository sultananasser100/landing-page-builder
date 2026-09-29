import { expect, test } from "@playwright/test";

import { E2E_ADMIN } from "./auth-fixtures";

// These specs do not depend on what is in the test database: they accept
// either the page list or the empty state.

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(E2E_ADMIN.email);
  await page.getByLabel("Password").fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/dashboard");
});

test("shows the pages workspace", async ({ page }) => {
  await expect(page).toHaveTitle("Pages · Dashboard");
  await expect(page.getByRole("heading", { level: 1, name: "Pages" })).toBeVisible();

  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "Landing Page Builder" })).toHaveAttribute(
    "href",
    "/dashboard",
  );
  await expect(header.getByRole("button", { name: "Sign out" })).toBeVisible();

  const list = page.getByRole("main").getByRole("list");
  const emptyState = page.getByRole("heading", { name: "No pages yet" });
  await expect(list.or(emptyState)).toBeVisible();
});

test("is not indexed", async ({ page }) => {
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
});

test("live links open published pages in a new tab", async ({ page }) => {
  const liveLinks = page.getByRole("link", { name: /^View live/ });
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
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflows).toBe(false);
});
