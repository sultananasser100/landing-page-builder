// Test-only admin credentials. playwright.config.ts hashes the password and
// passes the auth env vars straight to the dev server, so no real credentials
// (and no `\$`-escaped hash in .env.test) are needed.
export const E2E_ADMIN = {
  email: "admin@e2e.test",
  password: "e2e-admin-password",
} as const;
