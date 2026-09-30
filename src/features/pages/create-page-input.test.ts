import { describe, expect, it } from "@jest/globals";

import {
  createPageInputSchema,
  NAME_REQUIRED,
  NAME_TOO_LONG,
  SLUG_INVALID,
  SLUG_REQUIRED,
  SLUG_TOO_LONG,
  TEMPLATE_INVALID,
} from "./create-page-input";

const valid = { name: "Summer Sale", slug: "summer-sale", templateId: "blank" };

function firstMessage(input: unknown): string | undefined {
  const result = createPageInputSchema.safeParse(input);
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe("createPageInputSchema", () => {
  it("accepts a valid input and trims the name", () => {
    expect(createPageInputSchema.parse({ ...valid, name: "  Summer Sale  " })).toEqual(valid);
  });

  it("accepts the maximum lengths", () => {
    expect(
      createPageInputSchema.safeParse({ ...valid, name: "n".repeat(100), slug: "s".repeat(60) })
        .success,
    ).toBe(true);
  });

  it.each([
    ["a blank name", { ...valid, name: "   " }, NAME_REQUIRED],
    ["a missing name", { ...valid, name: null }, NAME_REQUIRED],
    ["a 101-character name", { ...valid, name: "n".repeat(101) }, NAME_TOO_LONG],
    ["an empty slug", { ...valid, slug: "" }, SLUG_REQUIRED],
    ["a 61-character slug", { ...valid, slug: "s".repeat(61) }, SLUG_TOO_LONG],
    ["uppercase letters", { ...valid, slug: "Summer" }, SLUG_INVALID],
    ["spaces", { ...valid, slug: "summer sale" }, SLUG_INVALID],
    ["underscores", { ...valid, slug: "summer_sale" }, SLUG_INVALID],
    ["slashes", { ...valid, slug: "a/b" }, SLUG_INVALID],
    ["an unknown template", { ...valid, templateId: "agency" }, TEMPLATE_INVALID],
    ["a missing template", { ...valid, templateId: null }, TEMPLATE_INVALID],
  ])("rejects %s", (_label, input, message) => {
    expect(firstMessage(input)).toBe(message);
  });
});
