import { describe, expect, it } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";

import type { EditorPage } from "@/features/pages/admin-queries";
import { sectionDefinitions } from "@/features/sections/definitions";
import { PAGE_LIMITS, SECTION_TYPES, type Section } from "@/features/sections/page-content";
import { samplePageContent } from "@/features/sections/sample-page";

import { EditorCanvas, PREVIEW_ERROR_PLACEHOLDER } from "./editor-canvas";
import { EditorHeader, validationSummary } from "./editor-header";
import { EditorViewToggle } from "./editor-view-toggle";
import { InspectorPanel } from "./inspector-panel";
import { InvalidContent } from "./invalid-content";
import { PageEditor } from "./page-editor";
import { SectionOutline } from "./section-outline";
import { sectionLabel, sectionSummary } from "./section-summary";

const noop = () => {};
const noIssues = () => undefined;
const none = { errors: 0, publish: 0 };
const page: EditorPage = { id: "p1", name: "Sample SaaS page", slug: "sample", status: "published" };
const sections = samplePageContent.sections;

describe("section summary", () => {
  it("labels and summarises every section type", () => {
    for (const type of SECTION_TYPES) {
      const section = sectionDefinitions[type].createDefault() as Section;
      expect(sectionLabel(section)).toBe(sectionDefinitions[type].label);
      expect(sectionSummary(section).length).toBeGreaterThan(0);
    }
    const footer = sections.find((s) => s.type === "footer")!;
    expect(sectionSummary(footer)).toBe("Tidewell");
  });
});

describe("EditorHeader", () => {
  function render(dirty: boolean, counts = none) {
    return renderToStaticMarkup(
      <EditorHeader page={page} counts={counts} dirty={dirty} onReset={noop} />,
    );
  }

  it("shows the page, its status and URL, and a back link to the dashboard", () => {
    const html = render(false);
    expect(html).toMatch(/<h1[^>]*>Sample SaaS page<\/h1>/);
    expect(html).toContain(">Published</span>");
    expect(html).toContain("/p/sample");
    expect(html).toMatch(/<a[^>]*href="\/dashboard"[^>]*>.*Pages<\/a>/);
  });

  it("disables reset and says there are no changes when clean", () => {
    const html = render(false);
    expect(html).toContain("No changes");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Reset changes<\/button>/);
  });

  it("says changes are not saved when dirty", () => {
    const html = render(true);
    expect(html).toContain("Unsaved changes · Saving isn&#x27;t available yet");
    expect(html).not.toMatch(/disabled=""[^>]*>Reset changes/);
  });

  it("announces the validation summary politely", () => {
    const html = render(false, { errors: 1, publish: 3 });
    expect(html).toMatch(/<p role="status"[^>]*>1 error · 3 needed to publish<\/p>/);
  });

  it("summarises validation counts", () => {
    expect(validationSummary(none)).toBe("All required content is filled in");
    expect(validationSummary({ errors: 2, publish: 0 })).toBe("2 errors");
    expect(validationSummary({ errors: 0, publish: 1 })).toBe("1 needed to publish");
  });
});

describe("SectionOutline", () => {
  function render(selection: Parameters<typeof SectionOutline>[0]["selection"], list = sections) {
    return renderToStaticMarkup(
      <SectionOutline
        sections={list}
        selection={selection}
        pageCounts={{ errors: 0, publish: 1 }}
        countsFor={(index) => (index === 0 ? { errors: 2, publish: 0 } : none)}
        onSelect={noop}
        onAdd={noop}
      />,
    );
  }

  it("lists page settings and every section with its label and summary", () => {
    const html = render({ kind: "section", id: "hero" });
    expect(html).toContain('<nav aria-label="Sections"');
    expect(html).toContain("Page settings");
    for (const section of sections) expect(html).toContain(sectionLabel(section));
    expect(html).toContain("Plan less. Ship more.");
  });

  it("marks the current selection", () => {
    expect(render({ kind: "section", id: "hero" }).match(/aria-current="true"/g)).toHaveLength(1);
    expect(render({ kind: "page" })).toMatch(/aria-current="true"[^>]*>.*Page settings/);
  });

  it("shows issue counts per entry", () => {
    const html = render({ kind: "page" });
    expect(html).toContain("2 errors");
    expect(html).toContain("1 to publish");
  });

  it("offers every section type in the Add section menu", () => {
    const html = render({ kind: "page" });
    expect(html).toContain("Add section");
    for (const type of SECTION_TYPES) expect(html).toContain(`>${sectionDefinitions[type].label}</button>`);
  });

  it("replaces the menu with a notice at the section limit", () => {
    const full = Array.from({ length: PAGE_LIMITS.sections.max }, (_, i) => ({
      ...sectionDefinitions.cta.createDefault(),
      id: `cta-${i}`,
    }));
    const html = render({ kind: "page" }, full);
    expect(html).not.toContain("Add section");
    expect(html).toContain("Maximum of 20 sections reached");
  });

  it("shows an empty state without sections", () => {
    expect(render({ kind: "page" }, [])).toContain("No sections yet.");
  });
});

describe("EditorCanvas", () => {
  const noErrors: ReadonlySet<string> = new Set();

  it("renders an inert preview of each section with a labelled select button", () => {
    const html = renderToStaticMarkup(
      <EditorCanvas
        sections={sections}
        selectedId="pricing"
        sectionsWithErrors={noErrors}
        onSelect={noop}
      />,
    );
    expect(html).toContain('<section aria-label="Preview"');
    expect(html.match(/<div inert="">/g)).toHaveLength(sections.length);
    expect(html).toContain('aria-label="Select Hero section"');
    expect(html).toContain('aria-label="Select Pricing section" aria-pressed="true"');
    expect(html).toContain("Plan less. Ship more.");
    expect(html).not.toContain("<main");
  });

  it("shows an empty state without sections", () => {
    const html = renderToStaticMarkup(
      <EditorCanvas sections={[]} selectedId={null} sectionsWithErrors={noErrors} onSelect={noop} />,
    );
    expect(html).toContain("This page has no sections yet.");
  });

  it("previews draft sections with empty fields", () => {
    const empty = sectionDefinitions.hero.createDefault();
    empty.data.heading = "";
    expect(() =>
      renderToStaticMarkup(
        <EditorCanvas
          sections={[empty]}
          selectedId={null}
          sectionsWithErrors={noErrors}
          onSelect={noop}
        />,
      ),
    ).not.toThrow();
  });

  it("never renders a section with errors; shows a placeholder that can still be selected", () => {
    const unsafe = structuredClone(sections[0]!);
    if (unsafe.type !== "hero") throw new Error("expected hero");
    unsafe.data.primaryButton.href = "javascript:alert(1)";

    const html = renderToStaticMarkup(
      <EditorCanvas
        sections={[unsafe, sections[1]!]}
        selectedId={null}
        sectionsWithErrors={new Set([unsafe.id])}
        onSelect={noop}
      />,
    );
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("Plan less. Ship more.");
    expect(html).toContain(PREVIEW_ERROR_PLACEHOLDER);
    expect(html).toContain('aria-label="Select Hero section"');
    // The valid section next to it still previews normally.
    expect(html.match(/<div inert="">/g)).toHaveLength(1);
    expect(html).toContain("Everything your team needs to stay in sync");
  });
});

describe("InspectorPanel", () => {
  function render(section: Section | undefined, index = 0) {
    return renderToStaticMarkup(
      <InspectorPanel
        content={samplePageContent}
        section={section}
        sectionIndex={index}
        pageName={page.name}
        pageSlug={page.slug}
        issueFor={noIssues}
        onUpdateMeta={noop}
        onUpdateSection={noop}
        onRemoveSection={noop}
      />,
    );
  }

  it("shows page settings with the meta fields and read-only page details", () => {
    const html = render(undefined);
    expect(html).toContain('<aside aria-label="Inspector"');
    expect(html).toMatch(/<h2[^>]*>Page settings<\/h2>/);
    expect(html).toContain('id="field-meta-title"');
    expect(html).toContain('maxLength="70"');
    expect(html).toContain('id="field-meta-description"');
    expect(html).toContain("/p/sample");
  });

  it("shows the selected section's inspector with a remove button", () => {
    const html = render(sections[1], 1);
    expect(html).toMatch(/<h2[^>]*>Features<\/h2>/);
    expect(html).toContain("Remove section");
    expect(html).toContain('id="field-sections-1-data-heading"');
  });
});

describe("EditorViewToggle", () => {
  it("renders pressed-state buttons hidden on large screens", () => {
    const html = renderToStaticMarkup(<EditorViewToggle view="preview" onChange={noop} />);
    expect(html).toContain('role="group" aria-label="Editor view"');
    expect(html).toContain("lg:hidden");
    expect(html).toMatch(/aria-pressed="false"[^>]*>Edit</);
    expect(html).toMatch(/aria-pressed="true"[^>]*>Preview</);
  });
});

describe("PageEditor", () => {
  it("renders the header, outline, preview and the first section's inspector", () => {
    const html = renderToStaticMarkup(<PageEditor page={page} initialContent={samplePageContent} />);

    // The only <h1> outside the inert preview is the page name (the previewed
    // hero's own <h1> is inert, so it is not in the accessibility tree).
    const [outsidePreview, preview] = html.split('<section aria-label="Preview"');
    expect(outsidePreview!.match(/<h1/g)).toHaveLength(1);
    expect(outsidePreview).toMatch(/<h1[^>]*>Sample SaaS page<\/h1>/);
    expect(preview).toMatch(/<div inert=""><section[^>]*><div[^>]*>.*<h1/);
    expect(html).toContain('<nav aria-label="Sections"');
    expect(html).toContain('<section aria-label="Preview"');
    expect(html).toContain('<aside aria-label="Inspector"');
    expect(html).toMatch(/<h2[^>]*>Hero<\/h2>/);
    expect(html).toContain("No changes");
    expect(html).toContain("All required content is filled in");
    expect(html).not.toContain('aria-invalid="true"');
  });

  it("reports publish requirements for a draft with empty fields", () => {
    const draft = structuredClone(samplePageContent);
    draft.meta.title = "";
    const html = renderToStaticMarkup(<PageEditor page={page} initialContent={draft} />);
    expect(html).toContain("1 needed to publish");
  });

  it("does not preview a section containing an unsafe link", () => {
    const draft = structuredClone(samplePageContent);
    const hero = draft.sections[0]!;
    if (hero.type !== "hero") throw new Error("expected hero");
    hero.data.primaryButton.href = "javascript:alert(1)";

    const html = renderToStaticMarkup(<PageEditor page={page} initialContent={draft} />);
    const preview = html.split('<section aria-label="Preview"')[1]!.split('<aside aria-label="Inspector"')[0]!;

    expect(preview).not.toContain("javascript:");
    expect(preview).toContain(PREVIEW_ERROR_PLACEHOLDER);
    expect(html).toContain("1 error");
    // The value is still shown (escaped) in the inspector so it can be fixed.
    expect(html).toContain('value="javascript:alert(1)"');
  });

  it("opens page settings when the page has no sections", () => {
    const html = renderToStaticMarkup(
      <PageEditor page={page} initialContent={{ ...samplePageContent, sections: [] }} />,
    );
    expect(html).toMatch(/<h2[^>]*>Page settings<\/h2>/);
    expect(html).toContain("Add at least one section to publish");
  });
});

describe("InvalidContent", () => {
  it("lists problems without editing and links back", () => {
    const issues = Array.from({ length: 23 }, (_, i) => ({ path: `sections.${i}.id`, message: "Invalid" }));
    const html = renderToStaticMarkup(<InvalidContent page={page} issues={issues} />);

    expect(html).toMatch(/<h1[^>]*>“Sample SaaS page” can’t be edited<\/h1>/);
    expect(html).toContain("Nothing has been changed.");
    expect(html).toContain("23 problems found");
    expect(html.match(/<li/g)).toHaveLength(20);
    expect(html).toContain("and 3 more.");
    expect(html).toContain('href="/dashboard"');
    expect(html).not.toContain("<input");
  });
});
