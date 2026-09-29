import { describe, expect, it } from "@jest/globals";

import { AuthConfigError, parseAuthConfig } from "./config";

// A syntactically valid bcrypt hash (not a real credential).
const HASH = "$2b$12$" + "a".repeat(53);
const SECRET = "x".repeat(32);

const validEnv = {
  ADMIN_EMAIL: "admin@example.com",
  ADMIN_PASSWORD_HASH: HASH,
  SESSION_SECRET: SECRET,
};

function errorMessage(env: Record<string, string | undefined>): string {
  try {
    parseAuthConfig(env);
  } catch (error) {
    expect(error).toBeInstanceOf(AuthConfigError);
    return (error as Error).message;
  }
  throw new Error("expected parseAuthConfig to throw");
}

describe("parseAuthConfig", () => {
  it("parses a valid environment", () => {
    const config = parseAuthConfig(validEnv);
    expect(config.adminEmail).toBe("admin@example.com");
    expect(config.passwordHash).toBe(HASH);
    expect(new TextDecoder().decode(config.sessionSecret)).toBe(SECRET);
  });

  it.each(["$2a$10$", "$2b$12$", "$2y$04$"])("accepts bcrypt prefix %s", (prefix) => {
    expect(() =>
      parseAuthConfig({ ...validEnv, ADMIN_PASSWORD_HASH: prefix + "b".repeat(53) }),
    ).not.toThrow();
  });

  it("reports every missing variable by name", () => {
    const message = errorMessage({});
    expect(message).toContain("ADMIN_EMAIL is not set");
    expect(message).toContain("ADMIN_PASSWORD_HASH is not set");
    expect(message).toContain("SESSION_SECRET is not set");
  });

  it("rejects an invalid admin email", () => {
    expect(errorMessage({ ...validEnv, ADMIN_EMAIL: "not-an-email" })).toContain(
      "ADMIN_EMAIL",
    );
  });

  it("rejects a session secret shorter than 32 characters", () => {
    expect(errorMessage({ ...validEnv, SESSION_SECRET: "x".repeat(31) })).toContain(
      "SESSION_SECRET must be at least 32 characters",
    );
  });

  it.each([
    ["a placeholder", "replace-with-bcrypt-hash"],
    // What Next.js leaves when `$2b$12$...` is not escaped in .env
    ["an expanded hash", "a".repeat(53)],
    ["a still-escaped hash", "\\$2b\\$12\\$" + "a".repeat(53)],
    ["a truncated hash", "$2b$12$" + "a".repeat(52)],
  ])("rejects %s as ADMIN_PASSWORD_HASH with an escaping hint", (_label, value) => {
    const message = errorMessage({ ...validEnv, ADMIN_PASSWORD_HASH: value });
    expect(message).toContain("ADMIN_PASSWORD_HASH must be a bcrypt hash");
    expect(message).toContain("escape each $ as \\$");
  });

  it("never includes secret values in error messages", () => {
    const leakySecret = "short-secret-value";
    const leakyHash = "not-a-hash-but-secret";
    const message = errorMessage({
      ADMIN_EMAIL: "bad-email-value",
      ADMIN_PASSWORD_HASH: leakyHash,
      SESSION_SECRET: leakySecret,
    });
    expect(message).not.toContain(leakySecret);
    expect(message).not.toContain(leakyHash);
    expect(message).not.toContain("bad-email-value");
  });
});
