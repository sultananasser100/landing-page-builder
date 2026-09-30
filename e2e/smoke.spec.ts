import { expect, test } from "@playwright/test";

import { signIn } from "./helpers";

test("the home page sends signed-out visitors to the login page", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL("/login?next=%2Fdashboard");
  await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
});

test("the home page sends signed-in visitors to the dashboard", async ({ page }) => {
  await signIn(page);

  await page.goto("/");

  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByRole("heading", { level: 1, name: "Pages" })).toBeVisible();
});
