import { expect, test } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Landing Page Builder");
  await expect(
    page.getByRole("heading", { name: "Landing Page Builder" }),
  ).toBeVisible();
});
