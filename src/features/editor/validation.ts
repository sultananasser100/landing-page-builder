import type { z } from "zod";

import {
  draftPageContentSchema,
  publishPageContentSchema,
  type PageContent,
} from "@/features/sections/page-content";

/**
 * - `error`: fails the draft schema (e.g. an unsafe URL). Content with errors
 *   could not be saved as a draft.
 * - `publish`: passes the draft schema but is needed before publishing
 *   (e.g. an empty required field).
 */
export type IssueSeverity = "error" | "publish";

export type IssuePath = readonly (string | number)[];

export type EditorIssue = {
  path: IssuePath;
  message: string;
  severity: IssueSeverity;
};

export type ValidationResult = {
  errors: EditorIssue[];
  publishIssues: EditorIssue[];
};

export function pathKey(path: IssuePath): string {
  return path.join(".");
}

function friendlyMessage(issue: z.core.$ZodIssue, severity: IssueSeverity): string {
  switch (issue.code) {
    case "too_big":
      return issue.origin === "string"
        ? `Must be at most ${issue.maximum} characters`
        : `Can have at most ${issue.maximum} items`;
    case "too_small":
      if (issue.path.length === 1 && issue.path[0] === "sections") {
        return "Add at least one section to publish";
      }
      return issue.origin === "array"
        ? `Needs at least ${issue.minimum} ${issue.minimum === 1 ? "item" : "items"}`
        : issue.message;
    case "custom":
      return issue.message === "Required" && severity === "publish"
        ? "Required to publish"
        : issue.message;
    default:
      return issue.message;
  }
}

function toIssues(
  issues: readonly z.core.$ZodIssue[],
  severity: IssueSeverity,
): EditorIssue[] {
  return issues.map((issue) => ({
    path: issue.path.filter((part): part is string | number => typeof part !== "symbol"),
    message: friendlyMessage(issue, severity),
    severity,
  }));
}

/**
 * Validates editor content against both schemas. An issue reported by both is
 * only listed as an error.
 */
export function validateContent(content: PageContent): ValidationResult {
  const draft = draftPageContentSchema.safeParse(content);
  const publish = publishPageContentSchema.safeParse(content);

  const errors = draft.success ? [] : toIssues(draft.error.issues, "error");
  const errorKeys = new Set(errors.map((issue) => pathKey(issue.path)));
  const publishIssues = (publish.success ? [] : toIssues(publish.error.issues, "publish"))
    .filter((issue) => !errorKeys.has(pathKey(issue.path)));

  return { errors, publishIssues };
}

/** The most severe issue reported exactly at `path`, if any. */
export function issueAt(result: ValidationResult, path: IssuePath): EditorIssue | undefined {
  const key = pathKey(path);
  return (
    result.errors.find((issue) => pathKey(issue.path) === key) ??
    result.publishIssues.find((issue) => pathKey(issue.path) === key)
  );
}

/**
 * Ids of sections with draft errors (e.g. an unsafe URL). Their content has
 * not passed validation, so it must not be passed to the public renderers.
 * Publish-only issues (empty required fields) do not count.
 */
export function sectionIdsWithErrors(
  content: PageContent,
  result: ValidationResult,
): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const issue of result.errors) {
    const [root, index] = issue.path;
    if (root !== "sections" || typeof index !== "number") continue;
    const section = content.sections[index];
    if (section) ids.add(section.id);
  }
  return ids;
}

export type IssueCounts = { errors: number; publish: number };

function startsWith(path: IssuePath, prefix: IssuePath): boolean {
  return prefix.every((part, index) => path[index] === part);
}

/** Counts issues at or below `prefix` (e.g. `["sections", 2]`). */
export function countIssues(result: ValidationResult, prefix: IssuePath): IssueCounts {
  return {
    errors: result.errors.filter((issue) => startsWith(issue.path, prefix)).length,
    publish: result.publishIssues.filter((issue) => startsWith(issue.path, prefix)).length,
  };
}
