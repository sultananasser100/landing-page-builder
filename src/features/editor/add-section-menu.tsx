import { useRef } from "react";

import { sectionDefinitions } from "@/features/sections/definitions";
import {
  PAGE_LIMITS,
  SECTION_TYPES,
  type SectionType,
} from "@/features/sections/page-content";

/** A disclosure listing all section types; adding appends a default section. */
export function AddSectionMenu({
  sectionCount,
  onAdd,
}: {
  sectionCount: number;
  onAdd: (type: SectionType) => void;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  if (sectionCount >= PAGE_LIMITS.sections.max) {
    return (
      <p className="text-xs text-muted-foreground">
        Maximum of {PAGE_LIMITS.sections.max} sections reached
      </p>
    );
  }

  return (
    <details ref={detailsRef} className="group rounded-md border">
      <summary className="cursor-pointer list-none rounded-md px-3 py-2 text-sm font-medium hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true">+ </span>Add section
      </summary>
      <ul className="border-t p-1">
        {SECTION_TYPES.map((type) => (
          <li key={type}>
            <button
              type="button"
              className="w-full rounded-sm px-3 py-1.5 text-left text-sm hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              onClick={() => {
                onAdd(type);
                if (detailsRef.current) detailsRef.current.open = false;
              }}
            >
              {sectionDefinitions[type].label}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
