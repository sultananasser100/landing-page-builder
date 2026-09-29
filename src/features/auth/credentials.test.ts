import { beforeAll, describe, expect, it } from "@jest/globals";
import { hash } from "bcryptjs";

import { normalizeEmail, verifyAdminCredentials } from "./credentials";

const PASSWORD = "correct horse battery staple";
let config: { adminEmail: string; passwordHash: string };

beforeAll(async () => {
  // Low cost keeps the test fast; production hashes use cost 12.
  config = { adminEmail: "Admin@Example.com", passwordHash: await hash(PASSWORD, 4) };
});

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Admin@Example.COM ")).toBe("admin@example.com");
  });
});

describe("verifyAdminCredentials", () => {
  it("accepts the correct email and password", async () => {
    expect(await verifyAdminCredentials(config, "Admin@Example.com", PASSWORD)).toBe(true);
  });

  it("compares email case-insensitively and ignores surrounding whitespace", async () => {
    expect(await verifyAdminCredentials(config, " admin@EXAMPLE.com ", PASSWORD)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    expect(await verifyAdminCredentials(config, "admin@example.com", "wrong")).toBe(false);
  });

  it("rejects a wrong email", async () => {
    expect(await verifyAdminCredentials(config, "other@example.com", PASSWORD)).toBe(false);
  });

  it("does not trim or case-fold the password", async () => {
    expect(await verifyAdminCredentials(config, "admin@example.com", ` ${PASSWORD}`)).toBe(
      false,
    );
    expect(
      await verifyAdminCredentials(config, "admin@example.com", PASSWORD.toUpperCase()),
    ).toBe(false);
  });

  it("rejects passwords longer than bcrypt's 72-byte limit", async () => {
    const longPassword = "a".repeat(72);
    const longConfig = { ...config, passwordHash: await hash(longPassword, 4) };
    expect(await verifyAdminCredentials(longConfig, "admin@example.com", longPassword)).toBe(
      true,
    );
    // bcrypt alone would accept this, because it ignores bytes after the 72nd.
    expect(
      await verifyAdminCredentials(longConfig, "admin@example.com", `${longPassword}extra`),
    ).toBe(false);
  });
});
