import { describe, expect, it } from "@jest/globals";

import { formatDateTimeUtc } from "./format";

describe("formatDateTimeUtc", () => {
  it("formats date and time in UTC with an explicit label", () => {
    expect(formatDateTimeUtc(new Date("2026-09-29T10:05:00Z"))).toBe(
      "Sep 29, 2026, 10:05 AM UTC",
    );
  });

  it("uses UTC rather than the local time zone near midnight", () => {
    expect(formatDateTimeUtc(new Date("2026-01-01T00:30:00Z"))).toBe(
      "Jan 1, 2026, 12:30 AM UTC",
    );
    expect(formatDateTimeUtc(new Date("2025-12-31T23:59:00Z"))).toBe(
      "Dec 31, 2025, 11:59 PM UTC",
    );
  });
});
