import { describe, expect, it } from "vitest";

import { publishPageContentSchema, SECTION_TYPES } from "./page-content";
import { samplePageContent } from "./sample-page";

describe("seeded sample page", () => {
  it("validates against the publish schema", () => {
    const result = publishPageContentSchema.safeParse(samplePageContent);
    expect(result.error?.issues ?? []).toEqual([]);
  });

  it("contains every section type", () => {
    const types = samplePageContent.sections.map((section) => section.type);
    for (const type of SECTION_TYPES) expect(types).toContain(type);
  });
});
