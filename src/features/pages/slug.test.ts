import { describe, expect, it } from "@jest/globals";

import { PAGE_NAME_MAX_LENGTH, SLUG_MAX_LENGTH, SLUG_PATTERN, slugify } from "./slug";

describe("slugify", () => {
  it.each([
    ["Summer Sale", "summer-sale"],
    ["  Spaced   out  ", "spaced-out"],
    ["Rock & Roll!", "rock-roll"],
    ["already-a-slug", "already-a-slug"],
    ["Café Crème", "cafe-creme"],
    ["Launch 2026", "launch-2026"],
    ["--edge--", "edge"],
    ["", ""],
    ["!!!", ""],
    ["日本語", ""],
  ])("turns %j into %j", (name, slug) => {
    expect(slugify(name)).toBe(slug);
  });

  it("caps the length and never ends with a hyphen", () => {
    expect(slugify(`${"a".repeat(59)} bbb`)).toBe("a".repeat(59));
    expect(slugify("word ".repeat(30)).length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
  });

  it("only produces slugs the slug rules accept", () => {
    for (const name of ["Hello, World", "Ünïcödé", "a_b c"]) {
      expect(slugify(name)).toMatch(SLUG_PATTERN);
    }
  });
});

describe("limits", () => {
  it("uses the approved limits", () => {
    expect(SLUG_MAX_LENGTH).toBe(60);
    expect(PAGE_NAME_MAX_LENGTH).toBe(100);
  });
});
