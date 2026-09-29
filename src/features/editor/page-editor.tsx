"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import type { EditorPage } from "@/features/pages/admin-queries";
import { sectionDefinitions } from "@/features/sections/definitions";
import type { PageContent, SectionType } from "@/features/sections/page-content";
import { cn } from "@/lib/utils";

import { EditorCanvas } from "./editor-canvas";
import { EditorHeader } from "./editor-header";
import {
  createEditorState,
  editorReducer,
  hasUnsavedChanges,
  type EditorSelection,
} from "./editor-state";
import { EditorViewToggle, type EditorView } from "./editor-view-toggle";
import { InspectorPanel } from "./inspector-panel";
import { SectionOutline } from "./section-outline";
import {
  countIssues,
  issueAt,
  pathKey,
  sectionIdsWithErrors,
  validateContent,
} from "./validation";

/**
 * The interactive editor. All state is in memory (useReducer): nothing is
 * saved, so every change is lost on reload or navigation — the UI says so and
 * warns before leaving.
 */
export function PageEditor({
  page,
  initialContent,
}: {
  page: EditorPage;
  initialContent: PageContent;
}) {
  const [state, dispatch] = useReducer(editorReducer, initialContent, createEditorState);
  const [view, setView] = useState<EditorView>("edit");
  const inspectorRef = useRef<HTMLDivElement>(null);

  const { content, selection } = state;
  const dirty = useMemo(() => hasUnsavedChanges(state), [state]);

  // Validated synchronously on every change, so issue paths always match the
  // content being shown (a page is small enough for this to be cheap).
  const validation = useMemo(() => validateContent(content), [content]);
  const sectionsWithErrors = useMemo(
    () => sectionIdsWithErrors(content, validation),
    [content, validation],
  );
  const issueFor = useCallback(
    (path: readonly (string | number)[]) => issueAt(validation, path),
    [validation],
  );
  const totals = countIssues(validation, []);
  const metaCounts = countIssues(validation, ["meta"]);
  const pageLevel = [...validation.errors, ...validation.publishIssues].filter(
    (issue) => pathKey(issue.path) === "sections",
  );
  const pageCounts = {
    errors: metaCounts.errors + pageLevel.filter((i) => i.severity === "error").length,
    publish: metaCounts.publish + pageLevel.filter((i) => i.severity === "publish").length,
  };

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Older browsers need returnValue set to show the prompt.
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const selectedIndex =
    selection.kind === "section"
      ? content.sections.findIndex((section) => section.id === selection.id)
      : -1;
  const selectedSection = content.sections[selectedIndex];

  const select = (next: EditorSelection) => dispatch({ type: "select", selection: next });

  const selectFromPreview = (id: string) => {
    select({ kind: "section", id });
    if (view === "preview") {
      // On small screens, jump to the inspector for the chosen section.
      setView("edit");
      requestAnimationFrame(() => inspectorRef.current?.scrollIntoView({ block: "start" }));
    }
  };

  const addSection = (type: SectionType) =>
    dispatch({ type: "addSection", section: sectionDefinitions[type].createDefault() });

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:h-dvh">
      <EditorHeader
        page={page}
        counts={totals}
        dirty={dirty}
        onReset={() => dispatch({ type: "reset" })}
      />
      <EditorViewToggle view={view} onChange={setView} />

      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)_24rem]">
        <div
          className={cn(
            "border-b lg:col-start-1 lg:row-start-1 lg:block lg:overflow-y-auto lg:border-r lg:border-b-0",
            view === "edit" ? "block" : "hidden",
          )}
        >
          <SectionOutline
            sections={content.sections}
            selection={selection}
            pageCounts={pageCounts}
            countsFor={(index) => countIssues(validation, ["sections", index])}
            onSelect={select}
            onAdd={addSection}
          />
        </div>

        <div
          className={cn(
            "lg:col-start-2 lg:row-start-1 lg:block lg:overflow-y-auto",
            view === "preview" ? "block" : "hidden",
          )}
        >
          <EditorCanvas
            sections={content.sections}
            selectedId={selectedSection?.id ?? null}
            sectionsWithErrors={sectionsWithErrors}
            onSelect={selectFromPreview}
          />
        </div>

        <div
          ref={inspectorRef}
          className={cn(
            "lg:col-start-3 lg:row-start-1 lg:block lg:overflow-y-auto lg:border-l",
            view === "edit" ? "block" : "hidden",
          )}
        >
          <InspectorPanel
            content={content}
            section={selectedSection}
            sectionIndex={selectedIndex}
            pageName={page.name}
            pageSlug={page.slug}
            issueFor={issueFor}
            onUpdateMeta={(field, value) => dispatch({ type: "updateMeta", field, value })}
            onUpdateSection={(section) => dispatch({ type: "updateSection", section })}
            onRemoveSection={(id) => dispatch({ type: "removeSection", id })}
          />
        </div>
      </div>
    </div>
  );
}
