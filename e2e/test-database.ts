// Safety checks and fixtures for the Playwright test database. Kept free of
// Prisma/Next imports so it can be unit-tested and run from global setup.

/**
 * The database name from a connection string, or null if it cannot be parsed.
 * Only the name is ever used; credentials are never printed.
 */
export function databaseName(connectionString: string | undefined): string | null {
  if (!connectionString) return null;
  try {
    const name = new URL(connectionString).pathname.replace(/^\//, "");
    return name.length > 0 ? decodeURIComponent(name) : null;
  } catch {
    return null;
  }
}

/**
 * E2E persistence tests write to the database, so they only run against a
 * database whose name ends in `_test`. Throws with instructions otherwise.
 */
export function assertTestDatabase(connectionString: string | undefined): void {
  const name = databaseName(connectionString);
  if (name === null) {
    throw new Error(
      "E2E setup: DATABASE_URL is missing or invalid in .env.test. Create .env.test pointing at the test database (see .env.example), then run `npm run db:migrate:test`.",
    );
  }
  if (!name.endsWith("_test")) {
    throw new Error(
      `E2E setup refused to run: the database "${name}" does not end in "_test". E2E tests write to the database and must never run against a development database.`,
    );
  }
}

/** Slugs of the pages the E2E suites rely on. */
export const E2E_PAGES = {
  /** The seeded sample page (read-only for most specs). */
  sample: { slug: "sample", name: "Sample SaaS page" },
  /** A page the persistence spec edits, saves and publishes. Reset before every run. */
  persistence: { slug: "e2e-persistence", name: "E2E persistence page" },
} as const;
