import { useEffect, useRef } from "react";

import { sectionAnchors } from "@/features/sections/anchors";
import type { Section } from "@/features/sections/page-content";
import { RenderSection } from "@/features/sections/renderers";
import { cn } from "@/lib/utils";

import { sectionLabel } from "./section-summary";

export const PREVIEW_ERROR_PLACEHOLDER = "Fix the errors in this section to preview it.";

/**
 * Live preview of the draft using the public section renderers. Each rendered
 * section is `inert` (its links and FAQ toggles cannot be used); a labelled
 * overlay button on top selects it instead. Sections with draft errors are
 * never passed to the renderers (which expect validated content, e.g. safe
 * hrefs); a placeholder is shown instead.
 */
export function EditorCanvas({
  sections,
  selectedId,
  sectionsWithErrors,
  onSelect,
}: {
  sections: readonly Section[];
  selectedId: string | null;
  sectionsWithErrors: ReadonlySet<string>;
  onSelect: (id: string) => void;
}) {
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  // The same anchors as the published page.
  const anchors = sectionAnchors(sections);

  useEffect(() => {
    if (selectedId) itemRefs.current.get(selectedId)?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  return (
    <section aria-label="Preview" className="min-h-full bg-muted/40 p-3 sm:p-6">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-lg border bg-background shadow-sm">
        {sections.length === 0 ? (
          <p className="px-6 py-24 text-center text-sm text-muted-foreground">
            This page has no sections yet. Use “Add section” to add one.
          </p>
        ) : (
          sections.map((section, index) => {
            const selected = section.id === selectedId;
            const label = sectionLabel(section);
            return (
              <div
                key={section.id}
                data-section-id={section.id}
                className="relative"
                ref={(element) => {
                  if (element) itemRefs.current.set(section.id, element);
                  else itemRefs.current.delete(section.id);
                }}
              >
                {sectionsWithErrors.has(section.id) ? (
                  <div className="border-y border-dashed bg-muted/60 px-6 py-12 text-center">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {PREVIEW_ERROR_PLACEHOLDER}
                    </p>
                  </div>
                ) : (
                  <div inert>
                    <RenderSection section={section} anchor={anchors[index]!} />
                  </div>
                )}
                <button
                  type="button"
                  aria-label={`Select ${label} section`}
                  aria-pressed={selected}
                  onClick={() => onSelect(section.id)}
                  className={cn(
                    "absolute inset-0 w-full cursor-pointer ring-inset focus-visible:ring-4 focus-visible:ring-ring focus-visible:outline-none",
                    selected ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-primary/40",
                  )}
                >
                  {selected ? (
                    <span className="absolute top-0 left-0 rounded-br-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                      {label}
                    </span>
                  ) : null}
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
