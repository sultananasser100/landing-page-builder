import type { Section, SectionType } from "@/features/sections/page-content";
import { cn } from "@/lib/utils";

import { AddSectionMenu } from "./add-section-menu";
import type { EditorSelection } from "./editor-state";
import { sectionLabel, sectionSummary } from "./section-summary";
import type { IssueCounts } from "./validation";

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
        "flex w-full flex-col gap-0.5 rounded-md px-3 py-2 text-left focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        selected ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
      )}
    >
      {children}
    </button>
  );
}

export function SectionOutline({
  sections,
  selection,
  pageCounts,
  countsFor,
  onSelect,
  onAdd,
}: {
  sections: readonly Section[];
  selection: EditorSelection;
  /** Issues in page settings (meta) and page-level issues. */
  pageCounts: IssueCounts;
  countsFor: (index: number) => IssueCounts;
  onSelect: (selection: EditorSelection) => void;
  onAdd: (type: SectionType) => void;
}) {
  return (
    <nav aria-label="Sections" className="space-y-3 p-3">
      <ul className="space-y-1">
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
          const summary = sectionSummary(section);
          return (
            <li key={section.id}>
              <OutlineButton
                selected={selection.kind === "section" && selection.id === section.id}
                onClick={() => onSelect({ kind: "section", id: section.id })}
              >
                <span className="text-sm font-medium">{sectionLabel(section)}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {summary || "Untitled"}
                </span>
                <IssueTags counts={countsFor(index)} />
              </OutlineButton>
            </li>
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
