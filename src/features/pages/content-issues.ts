import type { z } from "zod";

export type ContentIssue = { path: string; message: string };

/**
 * Describes why stored content failed validation without echoing stored data.
 * Zod's own messages can include stored values (e.g. unrecognized key names,
 * our duplicate-id message), so every message here is rebuilt from the issue
 * code and schema-defined limits only. Paths come from schema keys and array
 * indexes, which are safe to show.
 */
export function describeStoredContentIssue(issue: z.core.$ZodIssue): ContentIssue {
  const path = issue.path.map(String).join(".") || "(root)";
  return { path, message: genericMessage(issue) };
}

function genericMessage(issue: z.core.$ZodIssue): string {
  switch (issue.code) {
    case "invalid_type":
      return `Missing or wrong type (expected ${issue.expected})`;
    case "too_big":
      if (issue.origin === "string") return `Longer than ${issue.maximum} characters`;
      if (issue.origin === "array") return `More than ${issue.maximum} items`;
      return "Too large";
    case "too_small":
      if (issue.origin === "string") return `Shorter than ${issue.minimum} characters`;
      if (issue.origin === "array") return `Fewer than ${issue.minimum} items`;
      return "Too small";
    case "invalid_format":
      return "Invalid format";
    case "invalid_value":
      return "Not an allowed value";
    case "unrecognized_keys":
      return issue.keys.length === 1
        ? "Contains 1 unexpected field"
        : `Contains ${issue.keys.length} unexpected fields`;
    case "invalid_union":
      return "Doesn't match any allowed shape";
    case "custom":
      // Our custom checks are duplicate ids and unsafe/invalid links.
      return issue.message.startsWith("Duplicate id") ? "Duplicate id" : "Invalid value";
    default:
      return "Invalid value";
  }
}
