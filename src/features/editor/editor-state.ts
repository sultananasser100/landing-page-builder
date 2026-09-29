import {
  PAGE_LIMITS,
  type PageContent,
  type Section,
} from "@/features/sections/page-content";

import { moveItem } from "./reorder";

// Pure editor state. Everything is in memory: nothing here reads from or
// writes to the database. New sections/items are created by the caller (they
// need random ids), so the reducer stays pure.

export type EditorSelection = { kind: "page" } | { kind: "section"; id: string };

export type EditorState = {
  /** The content as loaded; used for reset and the unsaved-changes check. */
  initial: PageContent;
  content: PageContent;
  selection: EditorSelection;
};

export type EditorAction =
  | { type: "select"; selection: EditorSelection }
  | { type: "updateMeta"; field: "title" | "description"; value: string }
  | { type: "updateSection"; section: Section }
  | { type: "addSection"; section: Section }
  | { type: "removeSection"; id: string }
  /** Moves a section to its final position `toIndex`; selection is unchanged. */
  | { type: "moveSection"; id: string; toIndex: number }
  | { type: "reset" };

function defaultSelection(content: PageContent): EditorSelection {
  const first = content.sections[0];
  return first ? { kind: "section", id: first.id } : { kind: "page" };
}

function hasSection(content: PageContent, id: string): boolean {
  return content.sections.some((section) => section.id === id);
}

export function createEditorState(content: PageContent): EditorState {
  return { initial: content, content, selection: defaultSelection(content) };
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "select": {
      const { selection } = action;
      if (selection.kind === "section" && !hasSection(state.content, selection.id)) {
        return state;
      }
      return { ...state, selection };
    }

    case "updateMeta":
      return {
        ...state,
        content: {
          ...state.content,
          meta: { ...state.content.meta, [action.field]: action.value },
        },
      };

    case "updateSection": {
      const index = state.content.sections.findIndex((s) => s.id === action.section.id);
      const current = state.content.sections[index];
      // Ignore unknown ids and attempts to change a section's type.
      if (!current || current.type !== action.section.type) return state;

      const sections = [...state.content.sections];
      sections[index] = action.section;
      return { ...state, content: { ...state.content, sections } };
    }

    case "addSection": {
      const { sections } = state.content;
      if (sections.length >= PAGE_LIMITS.sections.max) return state;
      if (hasSection(state.content, action.section.id)) return state;

      return {
        ...state,
        content: { ...state.content, sections: [...sections, action.section] },
        selection: { kind: "section", id: action.section.id },
      };
    }

    case "removeSection": {
      const { sections } = state.content;
      const index = sections.findIndex((s) => s.id === action.id);
      if (index === -1) return state;

      const remaining = sections.filter((s) => s.id !== action.id);
      let selection = state.selection;
      if (selection.kind === "section" && selection.id === action.id) {
        // Select the section that took its place, else the one before, else
        // page settings.
        const neighbour = remaining[index] ?? remaining[index - 1];
        selection = neighbour ? { kind: "section", id: neighbour.id } : { kind: "page" };
      }
      return { ...state, content: { ...state.content, sections: remaining }, selection };
    }

    case "moveSection": {
      const { sections } = state.content;
      const from = sections.findIndex((s) => s.id === action.id);
      const { toIndex } = action;
      if (from === -1 || toIndex === from || toIndex < 0 || toIndex >= sections.length) {
        return state;
      }
      // Section objects are reused as-is; only their order changes. Selection
      // is by id, so the selected section stays selected wherever it moves.
      return {
        ...state,
        content: { ...state.content, sections: moveItem(sections, from, toIndex) },
      };
    }

    case "reset": {
      const selection =
        state.selection.kind === "section" && !hasSection(state.initial, state.selection.id)
          ? defaultSelection(state.initial)
          : state.selection;
      return { ...state, content: state.initial, selection };
    }
  }
}

/** True when the content differs from what was loaded. */
export function hasUnsavedChanges(state: EditorState): boolean {
  return (
    state.content !== state.initial &&
    JSON.stringify(state.content) !== JSON.stringify(state.initial)
  );
}

export function getSelectedSection(state: EditorState): Section | undefined {
  const { selection } = state;
  if (selection.kind !== "section") return undefined;
  return state.content.sections.find((section) => section.id === selection.id);
}
