import { describe, expect, it } from "@jest/globals";
import { compare, getRounds } from "bcryptjs";

import {
  BCRYPT_COST,
  formatPasswordHashEnvLine,
  hashPassword,
  validatePasswordForHashing,
} from "./password-hash";

describe("validatePasswordForHashing", () => {
  it("accepts passwords up to 72 bytes", () => {
    expect(validatePasswordForHashing("a".repeat(72))).toBeNull();
    // 18 four-byte characters = 72 bytes
    expect(validatePasswordForHashing("😀".repeat(18))).toBeNull();
  });

  it("rejects empty passwords", () => {
    expect(validatePasswordForHashing("")).toMatch(/must not be empty/);
  });

  it("rejects passwords over 72 bytes, counting UTF-8 bytes", () => {
    expect(validatePasswordForHashing("a".repeat(73))).toMatch(/at most 72 bytes/);
    // 19 characters but 76 bytes
    expect(validatePasswordForHashing("😀".repeat(19))).toMatch(/at most 72 bytes/);
  });
});

describe("hashPassword", () => {
  it("uses cost 12 by default", () => {
    expect(BCRYPT_COST).toBe(12);
  });

  it("produces a hash that verifies", async () => {
    const passwordHash = await hashPassword("s3cret-password", 4);
    expect(getRounds(passwordHash)).toBe(4);
    expect(await compare("s3cret-password", passwordHash)).toBe(true);
  });

  it("refuses passwords it cannot hash faithfully", async () => {
    await expect(hashPassword("a".repeat(73), 4)).rejects.toThrow(/72 bytes/);
    await expect(hashPassword("", 4)).rejects.toThrow(/empty/);
  });
});

describe("formatPasswordHashEnvLine", () => {
  it("escapes every $ for Next.js .env expansion", () => {
    const passwordHash = "$2b$12$" + "a".repeat(53);
    expect(formatPasswordHashEnvLine(passwordHash)).toBe(
      `ADMIN_PASSWORD_HASH="\\$2b\\$12\\$${"a".repeat(53)}"`,
    );
  });
});
