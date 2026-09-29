import { describe, expect, it } from "@jest/globals";

import { draftPageContentSchema } from "@/features/sections/page-content";
import { samplePageContent } from "@/features/sections/sample-page";

import { describeStoredContentIssue, type ContentIssue } from "./content-issues";

// Marker strings stand in for stored values that must never appear in output.
const SECRET = "stored-secret-value";

type Loose = Record<string, unknown> & {
  schemaVersion: unknown;
  sections: (Record<string, unknown> & {
    id: string;
    type: string;
    data: Record<string, unknown> & {
      items?: (Record<string, unknown> & { id: string })[];
      primaryButton?: { label: unknown; href: unknown };
      heading?: unknown;
    };
  })[];
};

function sample(): Loose {
  return structuredClone(samplePageContent) as unknown as Loose;
}

function describeAll(content: unknown): ContentIssue[] {
  const result = draftPageContentSchema.safeParse(content);
  if (result.success) throw new Error("expected invalid content");
  return result.error.issues.map(describeStoredContentIssue);
}

describe("describeStoredContentIssue", () => {
  it("reports duplicate item ids without the stored id", () => {
    const content = sample();
    const items = content.sections[1]!.data.items!;
    items[0]!.id = `${SECRET}-id`;
    items[1]!.id = `${SECRET}-id`;

    const issues = describeAll(content);
    expect(issues).toEqual([{ path: "sections.1.data.items.1.id", message: "Duplicate id" }]);
    expect(JSON.stringify(issues)).not.toContain(SECRET);
  });

  it("reports duplicate section ids without the stored id", () => {
    const content = sample();
    content.sections[0]!.id = `${SECRET}-section`;
    content.sections[1]!.id = `${SECRET}-section`;

    const issues = describeAll(content);
    expect(issues).toEqual([{ path: "sections.1.id", message: "Duplicate id" }]);
    expect(JSON.stringify(issues)).not.toContain(SECRET);
  });

  it("reports unrecognized keys without the stored key names", () => {
    const content = sample();
    content.sections[0]!.data[`${SECRET}-key`] = "v";
    content[`${SECRET}-root-key`] = "v";
    content[`${SECRET}-other-key`] = "v";

    const issues = describeAll(content);
    expect(issues).toEqual(
      expect.arrayContaining([
        { path: "(root)", message: "Contains 2 unexpected fields" },
        { path: "sections.0.data", message: "Contains 1 unexpected field" },
      ]),
    );
    expect(JSON.stringify(issues)).not.toContain(SECRET);
  });

  it.each([
    [
      "an invalid enum value",
      (c: Loose) => {
        c.sections[1]!.data.items![0]!.icon = SECRET;
      },
      { path: "sections.1.data.items.0.icon", message: "Not an allowed value" },
    ],
    [
      "a wrong type",
      (c: Loose) => {
        c.sections[0]!.data.heading = 42;
      },
      { path: "sections.0.data.heading", message: "Missing or wrong type (expected string)" },
    ],
    [
      "a missing field",
      (c: Loose) => {
        delete c.sections[0]!.data.heading;
      },
      { path: "sections.0.data.heading", message: "Missing or wrong type (expected string)" },
    ],
    [
      "an overlong string",
      (c: Loose) => {
        c.sections[0]!.data.heading = SECRET.repeat(10);
      },
      { path: "sections.0.data.heading", message: "Longer than 100 characters" },
    ],
    [
      "an unsafe link",
      (c: Loose) => {
        c.sections[0]!.data.primaryButton!.href = `javascript:${SECRET}`;
      },
      { path: "sections.0.data.primaryButton.href", message: "Invalid value" },
    ],
    [
      "an invalid id format",
      (c: Loose) => {
        c.sections[0]!.id = `${SECRET} with spaces`;
      },
      { path: "sections.0.id", message: "Invalid format" },
    ],
    [
      "an unknown section type",
      (c: Loose) => {
        c.sections[0]!.type = SECRET;
      },
      { path: "sections.0.type", message: "Doesn't match any allowed shape" },
    ],
    [
      "a wrong schema version",
      (c: Loose) => {
        c.schemaVersion = SECRET;
      },
      { path: "schemaVersion", message: "Not an allowed value" },
    ],
  ])("describes %s generically", (_label, mutate, expected) => {
    const content = sample();
    mutate(content);

    const issues = describeAll(content);
    expect(issues).toContainEqual(expected);
    expect(JSON.stringify(issues)).not.toContain(SECRET);
  });

  it("reports non-object content at the root", () => {
    expect(describeAll(null)).toEqual([
      { path: "(root)", message: "Missing or wrong type (expected object)" },
    ]);
  });
});
