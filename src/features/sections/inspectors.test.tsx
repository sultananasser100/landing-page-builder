import { describe, expect, it } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";

import type { IssueLookup } from "@/features/editor/fields/field-utils";
import { issueAt, validateContent } from "@/features/editor/validation";

import { sectionDefinitions } from "./definitions";
import { SectionInspector, sectionInspectors } from "./inspectors";
import { SECTION_TYPES, type PageContent, type Section } from "./page-content";
import { samplePageContent } from "./sample-page";

const noop = () => {};
const noIssues = () => undefined;
const basePath = ["sections", 0, "data"] as const;

function render(section: Section, issueFor: IssueLookup = noIssues) {
  return renderToStaticMarkup(
    <SectionInspector section={section} basePath={basePath} issueFor={issueFor} onChange={noop} />,
  );
}

function sampleSection(type: Section["type"]): Section {
  const section = samplePageContent.sections.find((s) => s.type === type);
  if (!section) throw new Error(`no ${type} in sample`);
  return section;
}

/** Every leaf key under `data`, with array indexes kept (e.g. "items-0-title"). */
function leafPaths(value: unknown, prefix: string[] = []): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => leafPaths(item, [...prefix, String(index)]));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => leafPaths(child, [...prefix, key]));
  }
  return [prefix.join("-")];
}

describe("sectionInspectors", () => {
  it("has an inspector for every section type", () => {
    expect(Object.keys(sectionInspectors).sort()).toEqual([...SECTION_TYPES].sort());
  });

  it.each(SECTION_TYPES)("%s inspector has a control for every field of the sample", (type) => {
    const section = sampleSection(type);
    const html = render(section);

    const fields = leafPaths(section.data).filter((path) => !/(^|-)id$/.test(path));
    expect(fields.length).toBeGreaterThan(0);
    for (const field of fields) {
      expect(html).toContain(`id="field-sections-0-data-${field}"`);
    }
  });

  it.each(SECTION_TYPES)("%s inspector renders the section default", (type) => {
    const html = render(sectionDefinitions[type].createDefault());
    expect(html).toContain('id="field-sections-0-data-');
    expect(html).not.toContain('aria-invalid="true"');
  });

  it("uses the schema limits as maxLength", () => {
    const html = render(sampleSection("hero"));
    expect(html).toMatch(/id="field-sections-0-data-eyebrow" maxLength="40"/);
    expect(html).toMatch(/id="field-sections-0-data-heading" maxLength="100"/);
    expect(html).toMatch(/id="field-sections-0-data-subheading" maxLength="300"/);
  });

  it("shows validation messages for the section's fields", () => {
    const content: PageContent = structuredClone(samplePageContent);
    const hero = content.sections[0]!;
    if (hero.type !== "hero") throw new Error("expected hero");
    hero.data.heading = "";
    hero.data.primaryButton.href = "javascript:alert(1)";
    const result = validateContent(content);

    const html = render(hero, (path) => issueAt(result, path));
    expect(html).toContain("Required to publish");
    expect(html).toContain("Error: Must be an https:, http: or mailto: URL, a #anchor or a /path");
  });

  it("offers the secondary button when the hero has none", () => {
    const hero = sectionDefinitions.hero.createDefault();
    expect(hero.data.secondaryButton).toBeUndefined();
    expect(render(hero)).toContain("Add secondary button");
  });

  it("disables adding items at the schema maximum", () => {
    const section = sampleSection("pricing");
    if (section.type !== "pricing") throw new Error("expected pricing");
    const plan = section.data.plans[0]!;
    const full = {
      ...section,
      data: {
        ...section.data,
        plans: Array.from({ length: 4 }, (_, i) => ({ ...plan, id: `plan-${i}` })),
      },
    };
    expect(render(full)).toContain("Maximum of 4 plans reached");
  });
});
