import { execFileSync } from "node:child_process";
import path from "node:path";

import { config } from "dotenv";

import { assertTestDatabase } from "./test-database";

/**
 * Prepares the E2E test database: (1) refuses to run unless DATABASE_URL in
 * .env.test names a `_test` database, then (2) resets the fixture pages the
 * specs rely on (e2e/reset-fixtures.ts, run under tsx). The dev database is
 * never touched.
 */
export default function globalSetup() {
  const env = config({ path: ".env.test", quiet: true }).parsed ?? {};
  const connectionString = env.DATABASE_URL;
  assertTestDatabase(connectionString);

  const tsx = path.resolve("node_modules/tsx/dist/cli.mjs");
  execFileSync(process.execPath, [tsx, "e2e/reset-fixtures.ts"], {
    // Only the test database URL is passed; .env is never read by the child.
    env: { ...process.env, DATABASE_URL: connectionString },
    stdio: "inherit",
  });
}
