import type { SectionOfType, SectionType } from "@/features/sections/page-content";

import type { IssueLookup } from "./fields/field-utils";
import type { IssuePath } from "./validation";

export type SectionInspectorProps<T extends SectionType> = {
  section: SectionOfType<T>;
  /** Path of the section's data in PageContent, e.g. `["sections", 2, "data"]`. */
  basePath: IssuePath;
  issueFor: IssueLookup;
  onChange: (section: SectionOfType<T>) => void;
};

/** Returns a helper that merges a partial data update into the section. */
export function dataUpdater<T extends SectionType>({
  section,
  onChange,
}: Pick<SectionInspectorProps<T>, "section" | "onChange">) {
  return (patch: Partial<SectionOfType<T>["data"]>) =>
    onChange({ ...section, data: { ...section.data, ...patch } });
}

/** Builds a content path below the section's data. */
export function pathBuilder(basePath: IssuePath) {
  return (...parts: (string | number)[]): IssuePath => [...basePath, ...parts];
}
