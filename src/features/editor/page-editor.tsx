"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useTransition,
} from "react";

import { publishPage, savePageDraft } from "@/features/pages/actions";
import type { EditorPage, PageStatus } from "@/features/pages/admin-queries";
import { sectionDefinitions } from "@/features/sections/definitions";
import type { PageContent, SectionType } from "@/features/sections/page-content";
import { cn } from "@/lib/utils";

import { EditorCanvas } from "./editor-canvas";
import { feedbackFor, requestFailureMessage, type ActionKind } from "./action-results";
import { EditorHeader, type ActionFeedback } from "./editor-header";
import {
  createEditorState,
  editorReducer,
  hasUnsavedChanges,
  type EditorSelection,
} from "./editor-state";
import { EditorViewToggle, type EditorView } from "./editor-view-toggle";
import { InspectorPanel } from "./inspector-panel";
import { SectionOutline } from "./section-outline";
import { sectionLabel } from "./section-summary";
import { isSessionExpired } from "./session-check";
import {
  countIssues,
  issueAt,
  pathKey,
  sectionIdsWithErrors,
  validateContent,
} from "./validation";

/**
 * The interactive editor. Edits live in memory (useReducer) until the admin
 * clicks Save, which sends them to a Server Action; Publish then publishes the
 * saved draft. Unsaved edits are lost on reload or navigation, so the editor
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
  const [announcement, setAnnouncement] = useState("");
  // Page facts that change after a save or publish (the loaded values come
  // from the server; action results replace them).
  const [version, setVersion] = useState(page.version);
  const [status, setStatus] = useState<PageStatus>(page.status);
  const [feedback, setFeedback] = useState<ActionFeedback>(null);
  const [pending, startTransition] = useTransition();
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

  const run = (kind: ActionKind) => {
    // Snapshot what is being saved: edits made while it is in flight stay unsaved.
    const sent = content;
    setFeedback(null);
    startTransition(async () => {
      try {
        const result =
          kind === "save"
            ? await savePageDraft({ pageId: page.id, expectedVersion: version, content: sent })
            : await publishPage({ pageId: page.id, expectedVersion: version });

        setFeedback(feedbackFor(kind, result, new Date()));
        if (!result.ok) return;
        setVersion(result.version);
        setStatus(result.status);
        if (kind === "save") dispatch({ type: "markSaved", saved: sent });
      } catch {
        // The action gave no result: a network failure, an unexpected error, or
        // a signed-out session (the proxy redirects the request to /login). The
        // edits stay in the editor either way.
        setFeedback({
          tone: "error",
          message: requestFailureMessage(kind, await isSessionExpired()),
        });
      }
    });
  };

  const addSection = (type: SectionType) =>
    dispatch({ type: "addSection", section: sectionDefinitions[type].createDefault() });

  // Drag and drop, the handle's arrow keys, and the Move up/down buttons all
  // reorder through the reducer; the result is announced to screen readers.
  const moveSection = (id: string, toIndex: number) => {
    const section = content.sections.find((s) => s.id === id);
    if (!section) return;
    dispatch({ type: "moveSection", id, toIndex });
    setAnnouncement(
      `${sectionLabel(section)} moved to position ${toIndex + 1} of ${content.sections.length}.`,
    );
  };

  return (
    // On desktop the editor fills exactly the viewport (flex-none lets h-dvh
    // apply) and each column scrolls on its own; the document does not scroll.
    <div className="flex min-h-0 flex-1 flex-col lg:h-dvh lg:flex-none">
      <EditorHeader
        page={page}
        status={status}
        counts={totals}
        dirty={dirty}
        pending={pending}
        feedback={feedback}
        onSave={() => run("save")}
        onPublish={() => run("publish")}
        onReset={() => dispatch({ type: "reset" })}
      />
      <EditorViewToggle view={view} onChange={setView} />

      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)_24rem] lg:grid-rows-[minmax(0,1fr)]">
        <div
          className={cn(
            "border-b lg:relative lg:col-start-1 lg:row-start-1 lg:block lg:overflow-y-auto lg:border-r lg:border-b-0",
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
            onMove={moveSection}
          />
        </div>

        <div
          className={cn(
            "lg:relative lg:col-start-2 lg:row-start-1 lg:block lg:overflow-y-auto",
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
            "lg:relative lg:col-start-3 lg:row-start-1 lg:block lg:overflow-y-auto lg:border-l",
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
            onMoveSection={moveSection}
          />
        </div>
      </div>
      <p role="status" aria-live="polite" className="sr-only" data-testid="reorder-announcement">
        {announcement}
      </p>
    </div>
  );
}
