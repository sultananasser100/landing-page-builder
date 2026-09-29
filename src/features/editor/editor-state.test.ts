import { describe, expect, it } from "@jest/globals";

import { sectionDefinitions } from "@/features/sections/definitions";
import {
  draftPageContentSchema,
  PAGE_LIMITS,
  type PageContent,
  type SectionOfType,
} from "@/features/sections/page-content";
import { samplePageContent } from "@/features/sections/sample-page";

import {
  createEditorState,
  editorReducer,
  getSelectedSection,
  hasUnsavedChanges,
  type EditorState,
} from "./editor-state";

function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

// Deep-frozen so any accidental mutation throws.
const content: PageContent = freeze(structuredClone(samplePageContent));
const [hero, features] = content.sections as [
  SectionOfType<"hero">,
  SectionOfType<"features">,
  ...unknown[],
];

function initialState(): EditorState {
  return createEditorState(content);
}

describe("createEditorState", () => {
  it("selects the first section", () => {
    const state = initialState();
    expect(state.selection).toEqual({ kind: "section", id: "hero" });
    expect(state.content).toBe(content);
    expect(state.initial).toBe(content);
    expect(hasUnsavedChanges(state)).toBe(false);
  });

  it("selects page settings when there are no sections", () => {
    const state = createEditorState({ ...content, sections: [] });
    expect(state.selection).toEqual({ kind: "page" });
  });
});

describe("select", () => {
  it("selects page settings or an existing section", () => {
    let state = editorReducer(initialState(), { type: "select", selection: { kind: "page" } });
    expect(state.selection).toEqual({ kind: "page" });
    state = editorReducer(state, { type: "select", selection: { kind: "section", id: "faq" } });
    expect(getSelectedSection(state)?.type).toBe("faq");
  });

  it("ignores unknown section ids", () => {
    const state = initialState();
    expect(
      editorReducer(state, { type: "select", selection: { kind: "section", id: "missing" } }),
    ).toBe(state);
  });
});

describe("updateMeta", () => {
  it("updates one meta field", () => {
    const state = editorReducer(initialState(), {
      type: "updateMeta",
      field: "title",
      value: "New title",
    });
    expect(state.content.meta).toEqual({ ...content.meta, title: "New title" });
    expect(hasUnsavedChanges(state)).toBe(true);
  });
});

describe("updateSection", () => {
  it("replaces the section with the same id", () => {
    const updated = { ...hero, data: { ...hero.data, heading: "Changed" } };
    const state = editorReducer(initialState(), { type: "updateSection", section: updated });

    expect(state.content.sections[0]).toBe(updated);
    expect(state.content.sections.slice(1)).toEqual(content.sections.slice(1));
    expect(state.initial).toBe(content);
  });

  it("allows empty strings while editing a draft", () => {
    const updated = { ...hero, data: { ...hero.data, heading: "" } };
    const state = editorReducer(initialState(), { type: "updateSection", section: updated });
    expect(draftPageContentSchema.safeParse(state.content).success).toBe(true);
  });

  it("ignores unknown ids", () => {
    const state = initialState();
    const stranger = { ...hero, id: "missing" };
    expect(editorReducer(state, { type: "updateSection", section: stranger })).toBe(state);
  });

  it("ignores attempts to change a section's type", () => {
    const state = initialState();
    const retyped = { ...features, id: hero.id };
    expect(editorReducer(state, { type: "updateSection", section: retyped })).toBe(state);
  });
});

describe("addSection", () => {
  it("appends the section and selects it", () => {
    const section = sectionDefinitions.faq.createDefault();
    const state = editorReducer(initialState(), { type: "addSection", section });

    expect(state.content.sections).toHaveLength(content.sections.length + 1);
    expect(state.content.sections.at(-1)).toBe(section);
    expect(state.selection).toEqual({ kind: "section", id: section.id });
    expect(draftPageContentSchema.safeParse(state.content).success).toBe(true);
  });

  it("does not exceed the section limit", () => {
    const full: PageContent = {
      ...content,
      sections: Array.from({ length: PAGE_LIMITS.sections.max }, () =>
        sectionDefinitions.cta.createDefault(),
      ),
    };
    const state = createEditorState(full);
    const next = editorReducer(state, {
      type: "addSection",
      section: sectionDefinitions.cta.createDefault(),
    });
    expect(next).toBe(state);
  });

  it("ignores a section whose id already exists", () => {
    const state = initialState();
    expect(editorReducer(state, { type: "addSection", section: hero })).toBe(state);
  });
});

describe("removeSection", () => {
  it("removes the section and selects the one that took its place", () => {
    const state = editorReducer(initialState(), { type: "removeSection", id: "hero" });
    expect(state.content.sections.map((s) => s.id)).not.toContain("hero");
    expect(state.selection).toEqual({ kind: "section", id: "features" });
  });

  it("selects the previous section when the last one is removed", () => {
    let state = editorReducer(initialState(), {
      type: "select",
      selection: { kind: "section", id: "footer" },
    });
    state = editorReducer(state, { type: "removeSection", id: "footer" });
    expect(state.selection).toEqual({ kind: "section", id: "cta" });
  });

  it("selects page settings when no sections remain", () => {
    let state = createEditorState({ ...content, sections: [hero] });
    state = editorReducer(state, { type: "removeSection", id: "hero" });
    expect(state.content.sections).toEqual([]);
    expect(state.selection).toEqual({ kind: "page" });
  });

  it("selects the next section when a selected middle section is removed", () => {
    let state = editorReducer(initialState(), {
      type: "select",
      selection: { kind: "section", id: "pricing" },
    });
    state = editorReducer(state, { type: "removeSection", id: "pricing" });

    expect(state.content.sections.map((s) => s.id)).toEqual([
      "hero",
      "features",
      "testimonials",
      "faq",
      "cta",
      "footer",
    ]);
    expect(state.selection).toEqual({ kind: "section", id: "faq" });
    expect(state.content.sections[3]).toBe(content.sections[4]);
  });

  it("keeps the selection when another section is removed", () => {
    const state = editorReducer(initialState(), { type: "removeSection", id: "faq" });
    expect(state.selection).toEqual({ kind: "section", id: "hero" });
  });

  it("ignores unknown ids", () => {
    const state = initialState();
    expect(editorReducer(state, { type: "removeSection", id: "missing" })).toBe(state);
  });
});

describe("reset", () => {
  it("restores the loaded content", () => {
    let state = editorReducer(initialState(), { type: "removeSection", id: "faq" });
    state = editorReducer(state, { type: "updateMeta", field: "title", value: "x" });
    expect(hasUnsavedChanges(state)).toBe(true);

    state = editorReducer(state, { type: "reset" });
    expect(state.content).toBe(content);
    expect(hasUnsavedChanges(state)).toBe(false);
  });

  it("falls back to the default selection when the selected section was added", () => {
    let state = editorReducer(initialState(), {
      type: "addSection",
      section: sectionDefinitions.cta.createDefault(),
    });
    state = editorReducer(state, { type: "reset" });
    expect(state.selection).toEqual({ kind: "section", id: "hero" });
  });
});

describe("hasUnsavedChanges", () => {
  it("is false when edits are reverted to the original values", () => {
    let state = editorReducer(initialState(), {
      type: "updateMeta",
      field: "title",
      value: "Changed",
    });
    state = editorReducer(state, {
      type: "updateMeta",
      field: "title",
      value: content.meta.title,
    });
    expect(hasUnsavedChanges(state)).toBe(false);
  });
});
