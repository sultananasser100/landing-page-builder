import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";
import { hashSync } from "bcryptjs";
import { config, parse } from "dotenv";

import { E2E_ADMIN } from "./e2e/auth-fixtures";

// E2E runs the app against the test database, never the dev one.
const testEnv = config({ path: ".env.test", quiet: true }).parsed ?? {};

// The .env files `next dev` loads, in its order of precedence.
const NEXT_DEV_ENV_FILES = [".env.development.local", ".env.local", ".env.development", ".env"];

/**
 * Next.js expands `$VAR` references in a variable passed through the process
 * environment when a loaded .env file also defines that variable, which would
 * corrupt a bcrypt hash (`$2b$04$...`). Escape `$` as `\$` in exactly that case
 * so the dev server receives the value unchanged.
 */
function forNextDevEnv(key: string, value: string): string {
  const definedInEnvFile = NEXT_DEV_ENV_FILES.some(
    (file) => existsSync(file) && key in parse(readFileSync(file)),
  );
  return definedInEnvFile ? value.replaceAll("$", "\\$") : value;
}

// A throwaway admin for the auth specs. Process env vars take precedence over
// .env files in Next.js. Low bcrypt cost keeps sign-in fast in tests.
const authEnv = {
  ADMIN_EMAIL: E2E_ADMIN.email,
  ADMIN_PASSWORD_HASH: forNextDevEnv("ADMIN_PASSWORD_HASH", hashSync(E2E_ADMIN.password, 4)),
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
