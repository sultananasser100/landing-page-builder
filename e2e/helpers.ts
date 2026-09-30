import { expect, type Page } from "@playwright/test";

import { E2E_ADMIN } from "./auth-fixtures";

/**
 * Signs in as the E2E admin and waits for the dashboard. Safe to call when the
 * page's context is already signed in: /login redirects straight to the
 * dashboard in that case, so the form is skipped.
 */
export async function signIn(page: Page) {
  await page.goto("/login");
  if (new URL(page.url()).pathname === "/dashboard") return;
  await page.getByLabel("Email").fill(E2E_ADMIN.email);
  await page.getByLabel("Password").fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/dashboard");
}
