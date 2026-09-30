import { describe, expect, it } from "@jest/globals";

import { sectionAnchors } from "./anchors";
import { SECTION_TYPES } from "./page-content";

const ofTypes = (...types: (typeof SECTION_TYPES)[number][]) => types.map((type) => ({ type }));

describe("sectionAnchors", () => {
  it("uses the section type as the anchor for each of the seven types", () => {
    expect(sectionAnchors(ofTypes(...SECTION_TYPES))).toEqual([...SECTION_TYPES]);
    expect(SECTION_TYPES).toHaveLength(7);
  });

  it("keeps the order of the sections", () => {
    expect(sectionAnchors(ofTypes("footer", "hero", "faq"))).toEqual(["footer", "hero", "faq"]);
  });

  it("numbers repeated types from 2, leaving the first one plain", () => {
    expect(sectionAnchors(ofTypes("features", "hero", "features", "features"))).toEqual([
      "features",
      "hero",
      "features-2",
      "features-3",
    ]);
  });

  it("always returns unique anchors", () => {
    const anchors = sectionAnchors(ofTypes("cta", "cta", "faq", "cta", "faq", "hero"));
    expect(new Set(anchors).size).toBe(anchors.length);
  });

  it("is deterministic and ignores everything but the type", () => {
    const sections = [
      { type: "hero" as const, id: "uuid-1" },
      { type: "hero" as const, id: "uuid-2" },
    ];
    expect(sectionAnchors(sections)).toEqual(["hero", "hero-2"]);
    expect(sectionAnchors(sections)).toEqual(sectionAnchors(sections));
  });

  it("handles an empty page", () => {
    expect(sectionAnchors([])).toEqual([]);
  });

  it("produces ids that satisfy the stored id pattern", () => {
    for (const anchor of sectionAnchors(ofTypes(...SECTION_TYPES, ...SECTION_TYPES))) {
      expect(anchor).toMatch(/^[A-Za-z0-9_-]{1,64}$/);
    }
  });
});
