import { randomBytes } from "node:crypto";

import { defineConfig, devices } from "@playwright/test";
import { hashSync } from "bcryptjs";
import { config } from "dotenv";

import { E2E_ADMIN } from "./e2e/auth-fixtures";

// E2E runs the app against the test database, never the dev one.
const testEnv = config({ path: ".env.test", quiet: true }).parsed ?? {};

// A throwaway admin for the auth specs. Process env vars take precedence over
// .env files in Next.js. Low bcrypt cost keeps sign-in fast in tests.
const authEnv = {
  ADMIN_EMAIL: E2E_ADMIN.email,
  ADMIN_PASSWORD_HASH: hashSync(E2E_ADMIN.password, 4),
  SESSION_SECRET: randomBytes(32).toString("base64url"),
};

const PORT = 3001;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { ...testEnv, ...authEnv },
  },
});
