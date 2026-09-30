import { describe, expect, it } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";

import type { EditorPage, PageStatus } from "@/features/pages/admin-queries";
import { sectionDefinitions } from "@/features/sections/definitions";
import { PAGE_LIMITS, SECTION_TYPES, type Section } from "@/features/sections/page-content";
import { samplePageContent } from "@/features/sections/sample-page";

import { EditorCanvas, PREVIEW_ERROR_PLACEHOLDER } from "./editor-canvas";
import {
  actionAvailability,
  EditorHeader,
  validationSummary,
  type ActionFeedback,
} from "./editor-header";
import { EditorViewToggle } from "./editor-view-toggle";
import { InspectorPanel, SectionMoveControls } from "./inspector-panel";
import { InvalidContent } from "./invalid-content";
import { PageEditor } from "./page-editor";
import { OutlineSectionRow, REORDER_INSTRUCTIONS_ID, SectionOutline } from "./section-outline";
import { sectionLabel, sectionSummary } from "./section-summary";

const noop = () => {};
const noIssues = () => undefined;
const none = { errors: 0, publish: 0 };
const page: EditorPage = {
  id: "p1",
  name: "Sample SaaS page",
  slug: "sample",
  status: "published",
  version: "2026-09-29T10:00:00.000Z",
};
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
  function render(
    dirty: boolean,
    counts = none,
    options: {
      status?: PageStatus;
      pending?: boolean;
      feedback?: ActionFeedback;
    } = {},
  ) {
    return renderToStaticMarkup(
      <EditorHeader
        page={page}
        status={options.status ?? "published"}
        counts={counts}
        dirty={dirty}
        pending={options.pending ?? false}
        feedback={options.feedback ?? null}
        onSave={noop}
        onPublish={noop}
        onReset={noop}
      />,
    );
  }
  const button = (html: string, name: string) =>
    html.match(new RegExp(`<button[^>]*>${name}</button>`))?.[0] ?? "";

  it("shows the page, its status and URL, and a back link to the dashboard", () => {
    const html = render(false);
    expect(html).toMatch(/<h1[^>]*>Sample SaaS page<\/h1>/);
    expect(html).toContain(">Published</span>");
    expect(html).toContain("/p/sample");
    expect(html).toMatch(/<a[^>]*href="\/dashboard"[^>]*>.*Pages<\/a>/);
  });

  it.each([
    ["draft", ">Draft</span>", false],
    ["published", ">Published</span>", true],
    ["unpublished-changes", ">Unpublished changes</span>", true],
  ] as const)("shows the %s status, with a live link only when published", (status, badge, live) => {
    const html = render(false, none, { status });
    expect(html).toContain(badge);
    if (live) {
      expect(html).toMatch(
        /<a href="\/p\/sample" target="_blank" rel="noopener noreferrer"[^>]*>View live/,
      );
    } else {
      expect(html).not.toContain("View live");
    }
  });

  it("says everything is saved when clean, and disables Reset and Save", () => {
    const html = render(false);
    expect(html).toContain("All changes saved");
    expect(button(html, "Reset changes")).toContain('disabled=""');
    expect(button(html, "Save")).toContain('disabled=""');
  });

  it("mentions that saved changes are not yet published", () => {
    expect(render(false, none, { status: "unpublished-changes" })).toContain(
      "All changes saved · not yet published",
    );
  });

  it("enables Save and Reset when dirty, and disables Publish with a reason", () => {
    const html = render(true);
    expect(html).toContain("Unsaved changes");
    expect(button(html, "Save")).not.toContain('disabled=""');
    expect(button(html, "Reset changes")).not.toContain('disabled=""');
    expect(button(html, "Publish")).toContain('disabled=""');
    expect(html).toContain('id="publish-hint"');
    expect(html).toContain("Save your changes before publishing.");
    expect(button(html, "Publish")).toContain('aria-describedby="publish-hint"');
  });

  it("enables Publish only when saved and complete", () => {
    const html = render(false);
    expect(button(html, "Publish")).not.toContain('disabled=""');
    expect(html).not.toContain("publish-hint");
  });

  it("blocks Save on errors but allows saving incomplete drafts", () => {
    expect(button(render(true, { errors: 1, publish: 0 }), "Save")).toContain('disabled=""');
    expect(button(render(true, { errors: 0, publish: 2 }), "Save")).not.toContain('disabled=""');
  });

  it("blocks Publish until publish issues are fixed, with the reason", () => {
    const html = render(false, { errors: 0, publish: 2 });
    expect(button(html, "Publish")).toContain('disabled=""');
    expect(html).toContain("Fill in the required content before publishing.");
  });

  it("disables everything while a save or publish is in progress", () => {
    const html = render(true, none, { pending: true });
    for (const name of ["Save", "Publish", "Reset changes"]) {
      expect(button(html, name)).toContain('disabled=""');
    }
  });

  it("announces feedback politely, and shows errors in the error style", () => {
    const success = render(false, none, {
      feedback: { tone: "success", message: "Saved at 10:05 AM UTC." },
    });
    expect(success).toMatch(/aria-live="polite"[^>]*data-testid="action-feedback"[^>]*>Saved at 10:05 AM UTC\.</);

    const failure = render(true, none, {
      feedback: { tone: "error", message: "Couldn't save." },
    });
    expect(failure).toMatch(
      /data-testid="action-feedback" class="[^"]*text-destructive[^"]*">Couldn&#x27;t save\./,
    );
  });

  it("keeps an empty live region when there is no feedback", () => {
    expect(render(false)).toMatch(/data-testid="action-feedback" class="sr-only"><\/p>/);
  });

  describe("actionAvailability", () => {
    it.each([
      // dirty, counts, pending → canSave, canPublish
      [false, none, false, false, true],
      [true, none, false, true, false],
      [true, { errors: 1, publish: 0 }, false, false, false],
      [false, { errors: 0, publish: 1 }, false, false, false],
      [false, none, true, false, false],
    ] as const)("dirty=%s counts=%j pending=%s", (dirty, counts, pending, canSave, canPublish) => {
      expect(actionAvailability({ dirty, counts, pending })).toMatchObject({ canSave, canPublish });
    });
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
        onMove={noop}
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

  it("gives every section a draggable reorder handle with its own name and instructions", () => {
    const html = render({ kind: "page" });
    const handles = html.match(/<button[^>]*data-reorder-handle="[^"]*"[^>]*>/g) ?? [];
    expect(handles).toHaveLength(sections.length);
    for (const handle of handles) {
      expect(handle).toContain('draggable="true"');
      expect(handle).toContain(`aria-describedby="${REORDER_INSTRUCTIONS_ID}"`);
    }
    for (const section of sections) {
      expect(html).toContain(`aria-label="Reorder ${sectionLabel(section)} section"`);
    }
    expect(html).toContain(`id="${REORDER_INSTRUCTIONS_ID}"`);
    expect(html).toContain("Drag to reorder, or use the arrow keys, Home and End.");
  });

  it("does not make page settings draggable", () => {
    const html = render({ kind: "page" });
    const pageSettingsItem = html.match(/<li>(?:(?!<\/li>).)*Page settings(?:(?!<\/li>).)*<\/li>/)?.[0];
    expect(pageSettingsItem).toBeDefined();
    expect(pageSettingsItem).not.toContain("draggable");
  });
});

describe("OutlineSectionRow drag visuals", () => {
  const hero = sections[0]!;
  function row(props: Partial<Parameters<typeof OutlineSectionRow>[0]> = {}) {
    return renderToStaticMarkup(
      <ul>
        <OutlineSectionRow section={hero} selected={false} counts={none} onSelect={noop} {...props} />
      </ul>,
    );
  }

  it("shows no drag feedback at rest", () => {
    const html = row();
    expect(html).not.toContain("opacity-50");
    expect(html).not.toContain("data-drop-indicator");
  });

  it("dims the row being dragged", () => {
    expect(row({ isDragging: true })).toContain("opacity-50");
  });

  it.each(["before", "after"] as const)("shows a hidden-from-AT drop line %s the row", (placement) => {
    const html = row({ dropIndicator: placement });
    expect(html).toMatch(
      new RegExp(`<span aria-hidden="true" data-drop-indicator="${placement}" class="[^"]*bg-primary`),
    );
    expect(html).toContain(placement === "before" ? "-top-0.5" : "-bottom-0.5");
  });

  it("keeps the select button separate from the drag handle", () => {
    const html = row({ selected: true });
    expect(html).toMatch(/<button[^>]*draggable="true"[^>]*aria-label="Reorder Hero section"/);
    expect(html).toMatch(/<button type="button" aria-current="true"[^>]*>(?:(?!draggable).)*Hero/);
  });
});

describe("SectionMoveControls", () => {
  function controls(index: number, count = 7) {
    return renderToStaticMarkup(
      <SectionMoveControls label="Pricing" index={index} count={count} onMove={noop} />,
    );
  }

  it("shows the position and both buttons with the section in their names", () => {
    const html = controls(3);
    expect(html).toContain("Position 4 of 7");
    expect(html).toMatch(/<button(?![^>]*disabled="")[^>]*>Move up<span class="sr-only">: Pricing section<\/span><\/button>/);
    expect(html).toMatch(/<button(?![^>]*disabled="")[^>]*>Move down<span class="sr-only">: Pricing section<\/span><\/button>/);
  });

  it("disables Move up for the first section and Move down for the last", () => {
    expect(controls(0)).toMatch(/<button[^>]*disabled=""[^>]*>Move up/);
    expect(controls(0)).not.toMatch(/<button[^>]*disabled=""[^>]*>Move down/);
    expect(controls(6)).toMatch(/<button[^>]*disabled=""[^>]*>Move down/);
    expect(controls(6)).not.toMatch(/<button[^>]*disabled=""[^>]*>Move up/);
  });

  it("disables both for a single section", () => {
    const html = controls(0, 1);
    expect(html.match(/disabled=""/g)).toHaveLength(2);
  });
});

describe("EditorCanvas", () => {
  const noErrors: ReadonlySet<string> = new Set();

  it("uses the same type-based anchors as the published page, not the stored ids", () => {
    const uuidSections = [
      sectionDefinitions.hero.createDefault(),
      sectionDefinitions.features.createDefault(),
      sectionDefinitions.features.createDefault(),
    ] as Section[];
    const html = renderToStaticMarkup(
      <EditorCanvas
        sections={uuidSections}
        selectedId={null}
        sectionsWithErrors={noErrors}
        onSelect={noop}
      />,
    );
    expect(html).toContain('id="hero"');
    expect(html).toContain('id="features"');
    expect(html).toContain('id="features-2"');
    for (const section of uuidSections) {
      // (leading space: `data-section-id="…"` legitimately holds the stored id)
      expect(html).not.toContain(` id="${section.id}"`);
      // Stored ids stay the identity used by the editor.
      expect(html).toContain(`data-section-id="${section.id}"`);
    }
  });

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
        onMoveSection={noop}
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
    expect(html).toContain("All changes saved");
    expect(html).toContain("All required content is filled in");
    expect(html).not.toContain('aria-invalid="true"');
  });

  it("reports publish requirements for a draft with empty fields", () => {
    const draft = structuredClone(samplePageContent);
    draft.meta.title = "";
    const html = renderToStaticMarkup(<PageEditor page={page} initialContent={draft} />);
    expect(html).toContain("1 needed to publish");
  });

  it("wires reordering: handles, move controls for the selected section, and a live region", () => {
    const html = renderToStaticMarkup(<PageEditor page={page} initialContent={samplePageContent} />);
    expect(html.match(/data-reorder-handle=/g)).toHaveLength(sections.length);
    // Hero (first) is selected by default.
    expect(html).toContain("Position 1 of 7");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Move up<span class="sr-only">: Hero section/);
    expect(html).toMatch(
      /<p role="status" aria-live="polite" class="sr-only" data-testid="reorder-announcement"><\/p>/,
    );
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
