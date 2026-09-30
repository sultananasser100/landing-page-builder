import { describe, expect, it } from "@jest/globals";

import { assertTestDatabase, databaseName } from "../../e2e/test-database";

describe("databaseName", () => {
  it.each([
    ["postgresql://u:p@localhost:5433/landing_builder_test", "landing_builder_test"],
    ["postgresql://u:p@localhost:5433/landing_builder", "landing_builder"],
    ["postgresql://u:p@localhost:5433/db%5Ftest?schema=public", "db_test"],
  ])("extracts the name from %s", (url, expected) => {
    expect(databaseName(url)).toBe(expected);
  });

  it.each([undefined, "", "not a url", "postgresql://u:p@localhost:5433", "postgresql://u:p@localhost:5433/"])(
    "returns null for %p",
    (url) => {
      expect(databaseName(url)).toBeNull();
    },
  );
});

describe("assertTestDatabase", () => {
  it("accepts databases ending in _test", () => {
    expect(() =>
      assertTestDatabase("postgresql://u:p@localhost:5433/landing_builder_test"),
    ).not.toThrow();
  });

  it.each([
    "postgresql://u:p@localhost:5433/landing_builder",
    "postgresql://u:p@localhost:5433/test_landing_builder",
    "postgresql://u:p@localhost:5433/landing_builder_test_backup",
    "postgresql://u:p@localhost:5433/production",
  ])("refuses %s", (url) => {
    expect(() => assertTestDatabase(url)).toThrow(/does not end in "_test"/);
  });

  it("explains how to set up .env.test when the URL is missing", () => {
    expect(() => assertTestDatabase(undefined)).toThrow(/Create \.env\.test/);
  });

  it("never includes credentials in error messages", () => {
    try {
      assertTestDatabase("postgresql://admin:hunter2-secret@localhost:5433/landing_builder");
    } catch (error) {
      expect((error as Error).message).not.toContain("hunter2-secret");
      expect((error as Error).message).not.toContain("admin");
    }
  });
});
