import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { SectionInspector } from "@/features/sections/inspectors";
import {
  PAGE_LIMITS,
  type PageContent,
  type Section,
} from "@/features/sections/page-content";

import { FieldMessage } from "./fields/field-message";
import type { IssueLookup } from "./fields/field-utils";
import { TextField } from "./fields/text-field";
import { sectionLabel } from "./section-summary";

export const REMOVE_SECTION_CONFIRMATION = (label: string) =>
  `Remove the ${label} section? You can undo this with “Reset changes”.`;

/**
 * The non-drag way to reorder (WCAG 2.2 SC 2.5.7): single-click buttons that
 * move the selected section one position. When a button becomes disabled at an
 * end of the list, focus moves to the other button instead of being lost.
 */
export function SectionMoveControls({
  label,
  index,
  count,
  onMove,
}: {
  label: string;
  index: number;
  count: number;
  onMove: (toIndex: number) => void;
}) {
  const upRef = useRef<HTMLButtonElement>(null);
  const downRef = useRef<HTMLButtonElement>(null);
  const isFirst = index <= 0;
  const isLast = index >= count - 1;

  const move = (toIndex: number) => {
    onMove(toIndex);
    requestAnimationFrame(() => {
      if (toIndex === 0) downRef.current?.focus();
      else if (toIndex === count - 1) upRef.current?.focus();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">
        Position {index + 1} of {count}
      </span>
      <Button
        ref={upRef}
        type="button"
        variant="outline"
        size="sm"
        disabled={isFirst}
        onClick={() => move(index - 1)}
      >
        Move up<span className="sr-only">: {label} section</span>
      </Button>
      <Button
        ref={downRef}
        type="button"
        variant="outline"
        size="sm"
        disabled={isLast}
        onClick={() => move(index + 1)}
      >
        Move down<span className="sr-only">: {label} section</span>
      </Button>
    </div>
  );
}

function PageSettingsInspector({
  meta,
  pageName,
  pageSlug,
  issueFor,
  onChange,
}: {
  meta: PageContent["meta"];
  pageName: string;
  pageSlug: string;
  issueFor: IssueLookup;
  onChange: (field: "title" | "description", value: string) => void;
}) {
  const sectionsIssue = issueFor(["sections"]);
  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold">Page settings</h2>
      <TextField
        path={["meta", "title"]}
        label="SEO title"
        value={meta.title}
        maxLength={PAGE_LIMITS.metaTitle}
        hint="Shown in browser tabs and search results."
        issue={issueFor(["meta", "title"])}
        onChange={(value) => onChange("title", value)}
      />
      <TextField
        path={["meta", "description"]}
        label="SEO description"
        multiline
        value={meta.description}
        maxLength={PAGE_LIMITS.metaDescription}
        issue={issueFor(["meta", "description"])}
        onChange={(value) => onChange("description", value)}
      />
      {sectionsIssue ? <FieldMessage id="page-sections-message" issue={sectionsIssue} /> : null}
      <dl className="space-y-2 rounded-lg border p-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Page name</dt>
          <dd className="break-words">{pageName}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Public URL</dt>
          <dd className="font-mono break-all">/p/{pageSlug}</dd>
        </div>
      </dl>
    </div>
  );
}

export function InspectorPanel({
  content,
  section,
  sectionIndex,
  pageName,
  pageSlug,
  issueFor,
  onUpdateMeta,
  onUpdateSection,
  onRemoveSection,
  onMoveSection,
}: {
  content: PageContent;
  /** The selected section; undefined when page settings are selected. */
  section: Section | undefined;
  sectionIndex: number;
  pageName: string;
  pageSlug: string;
  issueFor: IssueLookup;
  onUpdateMeta: (field: "title" | "description", value: string) => void;
  onUpdateSection: (section: Section) => void;
  onRemoveSection: (id: string) => void;
  /** Moves a section to its final position (the reducer's moveSection). */
  onMoveSection: (id: string, toIndex: number) => void;
}) {
  return (
    <aside aria-label="Inspector" className="p-4">
      {section ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold">{sectionLabel(section)}</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.confirm(REMOVE_SECTION_CONFIRMATION(sectionLabel(section)))) {
                  onRemoveSection(section.id);
                }
              }}
            >
              Remove section
            </Button>
          </div>
          <SectionMoveControls
            label={sectionLabel(section)}
            index={sectionIndex}
            count={content.sections.length}
            onMove={(toIndex) => onMoveSection(section.id, toIndex)}
          />
          <SectionInspector
            // Remount per section so list focus state never leaks between sections.
            key={section.id}
            section={section}
            basePath={["sections", sectionIndex, "data"]}
            issueFor={issueFor}
            onChange={onUpdateSection}
          />
        </div>
      ) : (
        <PageSettingsInspector
          meta={content.meta}
          pageName={pageName}
          pageSlug={pageSlug}
          issueFor={issueFor}
          onChange={onUpdateMeta}
        />
      )}
    </aside>
  );
}
