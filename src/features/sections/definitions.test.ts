import { describe, expect, it } from "vitest";

import { sectionDefinitions } from "./definitions";
import { draftPageContentSchema, SECTION_TYPES } from "./page-content";

describe("sectionDefinitions", () => {
  it("defines every section type", () => {
    expect(Object.keys(sectionDefinitions).sort()).toEqual([...SECTION_TYPES].sort());
  });

  it.each(SECTION_TYPES)("%s default is valid draft content", (type) => {
    const section = sectionDefinitions[type].createDefault();
    expect(section.type).toBe(type);

    const result = draftPageContentSchema.safeParse({
      schemaVersion: 1,
      meta: { title: "", description: "" },
      sections: [section],
    });
    expect(result.error?.issues ?? []).toEqual([]);
  });

  it.each(SECTION_TYPES)("%s default generates fresh ids", (type) => {
    const a = sectionDefinitions[type].createDefault();
    const b = sectionDefinitions[type].createDefault();
    expect(a.id).not.toBe(b.id);
  });

  it("a page made of every default is valid draft content", () => {
    const sections = SECTION_TYPES.map((type) => sectionDefinitions[type].createDefault());
    expect(
      draftPageContentSchema.safeParse({
        schemaVersion: 1,
        meta: { title: "", description: "" },
        sections,
      }).success,
    ).toBe(true);
  });
});
