import { useEffect, useRef, useState } from "react";

import type { Section, SectionType } from "@/features/sections/page-content";
import { Icon } from "@/features/sections/shared/icons";
import { cn } from "@/lib/utils";

import { AddSectionMenu } from "./add-section-menu";
import type { EditorSelection } from "./editor-state";
import { dropIndex, keyboardMoveIndex, type DropPlacement } from "./reorder";
import { sectionLabel, sectionSummary } from "./section-summary";
import type { IssueCounts } from "./validation";

/** Custom drag data type, so unrelated drags (files, text, links) are ignored. */
export const SECTION_DRAG_TYPE = "application/x-lpb-section";
export const REORDER_INSTRUCTIONS_ID = "section-reorder-instructions";

type DragState = {
  id: string;
  over: { index: number; placement: DropPlacement } | null;
} | null;

function IssueTags({ counts }: { counts: IssueCounts }) {
  if (counts.errors === 0 && counts.publish === 0) return null;
  return (
    <span className="flex flex-wrap gap-x-2 text-xs">
      {counts.errors > 0 ? (
        <span className="text-destructive">
          {counts.errors} {counts.errors === 1 ? "error" : "errors"}
        </span>
      ) : null}
      {counts.publish > 0 ? (
        <span className="text-amber-700 dark:text-amber-400">
          {counts.publish} to publish
        </span>
      ) : null}
    </span>
  );
}

function OutlineButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-current={selected ? "true" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full min-w-0 flex-col gap-0.5 rounded-md px-3 py-2 text-left focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        selected ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
      )}
    >
      {children}
    </button>
  );
}

/**
 * One section row. Presentational: drag state comes in as props so the
 * visuals can be rendered (and tested) without a browser.
 */
export function OutlineSectionRow({
  section,
  selected,
  counts,
  isDragging = false,
  dropIndicator = null,
  rowProps,
  handleProps,
  onSelect,
}: {
  section: Section;
  selected: boolean;
  counts: IssueCounts;
  isDragging?: boolean;
  /** Where a drop would land relative to this row, if anywhere. */
  dropIndicator?: DropPlacement | null;
  rowProps?: React.ComponentProps<"li">;
  handleProps?: React.ComponentProps<"button">;
  onSelect: () => void;
}) {
  const label = sectionLabel(section);
  const summary = sectionSummary(section);
  return (
    <li {...rowProps} className={cn("relative flex items-stretch gap-1", isDragging && "opacity-50")}>
      {dropIndicator ? (
        <span
          aria-hidden="true"
          data-drop-indicator={dropIndicator}
          className={cn(
            "pointer-events-none absolute inset-x-0 h-0.5 rounded-full bg-primary",
            dropIndicator === "before" ? "-top-0.5" : "-bottom-0.5",
          )}
        />
      ) : null}
      <button
        type="button"
        draggable
        data-reorder-handle={section.id}
        aria-label={`Reorder ${label} section`}
        aria-describedby={REORDER_INSTRUCTIONS_ID}
        {...handleProps}
        className="flex w-6 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-accent/60 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none active:cursor-grabbing"
      >
        <Icon name="grip-vertical" className="size-4" />
      </button>
      <OutlineButton selected={selected} onClick={onSelect}>
        <span className="text-sm font-medium">{label}</span>
        <span className="truncate text-xs text-muted-foreground">{summary || "Untitled"}</span>
        <IssueTags counts={counts} />
      </OutlineButton>
    </li>
  );
}

export function SectionOutline({
  sections,
  selection,
  pageCounts,
  countsFor,
  onSelect,
  onAdd,
  onMove,
}: {
  sections: readonly Section[];
  selection: EditorSelection;
  /** Issues in page settings (meta) and page-level issues. */
  pageCounts: IssueCounts;
  countsFor: (index: number) => IssueCounts;
  onSelect: (selection: EditorSelection) => void;
  onAdd: (type: SectionType) => void;
  /** Moves a section to its final position (the reducer's moveSection). */
  onMove: (id: string, toIndex: number) => void;
}) {
  // Transient drag UI state only; the section order lives in the reducer.
  const [drag, setDrag] = useState<DragState>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const refocusRef = useRef<string | null>(null);

  // Moving a focused element in the DOM can drop focus, so after a keyboard
  // reorder put focus back on the moved section's handle.
  useEffect(() => {
    const id = refocusRef.current;
    if (!id || !listRef.current) return;
    refocusRef.current = null;
    listRef.current.querySelector<HTMLElement>(`[data-reorder-handle="${id}"]`)?.focus();
  });

  const placementFor = (event: React.DragEvent<HTMLElement>): DropPlacement => {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientY < rect.top + rect.height / 2 ? "before" : "after";
  };

  const fromIndex = drag ? sections.findIndex((s) => s.id === drag.id) : -1;

  return (
    <nav aria-label="Sections" className="space-y-3 p-3">
      <p id={REORDER_INSTRUCTIONS_ID} className="sr-only">
        Drag to reorder, or use the arrow keys, Home and End.
      </p>
      <ul
        ref={listRef}
        className="space-y-1"
        onDragLeave={(event) => {
          // Clear the indicator only when the pointer leaves the whole list.
          if (drag && !event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setDrag({ ...drag, over: null });
          }
        }}
      >
        <li>
          <OutlineButton
            selected={selection.kind === "page"}
            onClick={() => onSelect({ kind: "page" })}
          >
            <span className="text-sm font-medium">Page settings</span>
            <IssueTags counts={pageCounts} />
          </OutlineButton>
        </li>
        {sections.map((section, index) => {
          const over = drag?.over?.index === index ? drag.over : null;
          // Hide the indicator where a drop would not move anything.
          const showIndicator =
            over !== null && fromIndex !== -1 && dropIndex(fromIndex, index, over.placement) !== fromIndex;

          return (
            <OutlineSectionRow
              key={section.id}
              section={section}
              selected={selection.kind === "section" && selection.id === section.id}
              counts={countsFor(index)}
              isDragging={drag?.id === section.id}
              dropIndicator={showIndicator ? over.placement : null}
              onSelect={() => onSelect({ kind: "section", id: section.id })}
              rowProps={{
                onDragOver: (event) => {
                  if (!drag || !event.dataTransfer.types.includes(SECTION_DRAG_TYPE)) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  const placement = placementFor(event);
                  if (drag.over?.index !== index || drag.over.placement !== placement) {
                    setDrag({ ...drag, over: { index, placement } });
                  }
                },
                onDrop: (event) => {
                  if (!drag || !event.dataTransfer.types.includes(SECTION_DRAG_TYPE)) return;
                  event.preventDefault();
                  const from = sections.findIndex((s) => s.id === drag.id);
                  setDrag(null);
                  if (from === -1) return; // the dragged section no longer exists
                  const to = dropIndex(from, index, placementFor(event));
                  if (to !== from) onMove(drag.id, to);
                },
              }}
              handleProps={{
                onDragStart: (event) => {
                  event.dataTransfer.setData(SECTION_DRAG_TYPE, section.id);
                  event.dataTransfer.effectAllowed = "move";
                  const row = event.currentTarget.closest("li");
                  if (row) event.dataTransfer.setDragImage(row, 12, 12);
                  setDrag({ id: section.id, over: null });
                },
                // Fires after a drop, Escape, or a drop outside the list.
                onDragEnd: () => setDrag(null),
                onKeyDown: (event) => {
                  const target = keyboardMoveIndex(event.key, index, sections.length);
                  if (target === null) return;
                  event.preventDefault();
                  refocusRef.current = section.id;
                  onMove(section.id, target);
                },
              }}
            />
          );
        })}
      </ul>
      {sections.length === 0 ? (
        <p className="px-3 text-sm text-muted-foreground">No sections yet.</p>
      ) : null}
      <AddSectionMenu sectionCount={sections.length} onAdd={onAdd} />
    </nav>
  );
}
