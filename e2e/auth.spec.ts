import { expect, test, type Page } from "@playwright/test";

import { E2E_ADMIN } from "./auth-fixtures";

async function signIn(page: Page, email: string, password: string) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("redirects signed-out visitors from /dashboard to /login", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("login page is not indexed", async ({ page }) => {
  await page.goto("/login");

  await expect(page).toHaveTitle("Sign in");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
});

test("shows a generic error for wrong credentials", async ({ page }) => {
  await page.goto("/login");
  await signIn(page, E2E_ADMIN.email, "wrong-password");

  // Next.js renders its own (empty) route announcer with role="alert", so
  // target the login error specifically.
  await expect(
    page.getByRole("alert").filter({ hasText: "Invalid email or password." }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByLabel("Email")).toHaveValue(E2E_ADMIN.email);
  await expect(page.getByLabel("Password")).toHaveValue("");
});

test("signs in, reaches the dashboard, and signs out", async ({ page, context }) => {
  await page.goto("/dashboard");
  await signIn(page, E2E_ADMIN.email.toUpperCase(), E2E_ADMIN.password);

  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByRole("heading", { level: 1, name: "Pages" })).toBeVisible();

  const [sessionCookie] = (await context.cookies()).filter((c) => c.name === "lpb_session");
  expect(sessionCookie).toMatchObject({ httpOnly: true, sameSite: "Lax", path: "/" });

  // Signed-in users are sent away from /login.
  await page.goto("/login");
  await expect(page).toHaveURL("/dashboard");

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/login");
  expect((await context.cookies()).some((c) => c.name === "lpb_session")).toBe(false);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
});

test("rejects a forged session cookie", async ({ page, context, baseURL }) => {
  await context.addCookies([
    { name: "lpb_session", value: "forged.token.value", url: baseURL! },
  ]);
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login/);
});

test("ignores an external next parameter", async ({ page }) => {
  await page.goto("/login?next=https://evil.example.com");
  await signIn(page, E2E_ADMIN.email, E2E_ADMIN.password);

  await expect(page).toHaveURL("/dashboard");
});
