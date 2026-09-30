import { describe, expect, it } from "@jest/globals";

import { statusFrom, statusOf, type PageStatus } from "./page-status";

// The database-facing loadPageStatuses is covered through the admin-queries
// tests; these cover the pure state rules.

describe("statusFrom", () => {
  it.each([
    [false, false, "draft"],
    [false, true, "draft"], // no snapshot: never published, whatever the draft
    [true, true, "published"],
    [true, false, "unpublished-changes"],
  ] as const)("published=%s inSync=%s → %s", (isPublished, inSync, expected) => {
    expect(statusFrom(isPublished, inSync)).toBe(expected);
  });
});

describe("statusOf", () => {
  it("defaults to draft for pages missing from the map", () => {
    const statuses = new Map<string, PageStatus>([["a", "published"]]);
    expect(statusOf(statuses, "a")).toBe("published");
    expect(statusOf(statuses, "b")).toBe("draft");
  });
});
