import { cn } from "@/lib/utils";

import type { EditorIssue } from "../validation";

/**
 * Errors (fail the draft schema) are red; publish requirements are amber.
 * Both are conveyed in text, not colour alone.
 */
export function FieldMessage({ id, issue }: { id: string; issue?: EditorIssue }) {
  if (!issue) return null;
  const isError = issue.severity === "error";
  return (
    <p
      id={id}
      className={cn(
        "text-xs",
        isError ? "text-destructive" : "text-amber-700 dark:text-amber-400",
      )}
    >
      {isError ? "Error: " : null}
      {issue.message}
    </p>
  );
}
