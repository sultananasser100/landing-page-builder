import type { EditorIssue, IssuePath } from "../validation";

// Editor field components are rendered inside the client-side PageEditor; they
// are plain modules (no "use client") because they receive callback props.

/** Looks up the issue for a path; provided by the editor from its validation result. */
export type IssueLookup = (path: IssuePath) => EditorIssue | undefined;

/** A DOM id derived from the content path, unique within the editor. */
export function fieldId(path: IssuePath): string {
  return `field-${path.join("-")}`;
}

export function describedBy(...ids: (string | false | null | undefined)[]): string | undefined {
  const present = ids.filter(Boolean);
  return present.length > 0 ? present.join(" ") : undefined;
}

/** "chart-column" → "Chart column" */
export function humanize(value: string): string {
  const words = value.replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
