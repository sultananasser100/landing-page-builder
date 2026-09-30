import type { PageActionResult } from "@/features/pages/actions";

import type { ActionFeedback } from "./editor-header";

export type ActionKind = "save" | "publish";

export const CONFLICT_MESSAGE =
  "This page was changed elsewhere since you opened it. Reload to get the latest version (unsaved edits here will be lost).";

export const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please sign in again.";

/** Feedback when the request itself failed (no result came back from the server). */
export function requestFailureMessage(kind: ActionKind, sessionExpired: boolean): string {
  return sessionExpired
    ? SESSION_EXPIRED_MESSAGE
    : `Couldn't ${kind} because something went wrong. Please try again.`;
}

/** Plain-language feedback for a failed save/publish; never includes content. */
export function failureMessage(
  kind: ActionKind,
  result: Extract<PageActionResult, { ok: false }>,
): string {
  const verb = kind === "save" ? "save" : "publish";
  switch (result.reason) {
    case "invalid":
      return kind === "save"
        ? `Couldn't save: ${result.issues.length} ${result.issues.length === 1 ? "problem" : "problems"} with the content. Fix the errors and try again.`
        : `Couldn't publish: ${result.issues.length} ${result.issues.length === 1 ? "field still needs" : "fields still need"} attention. Fill in the required content, save, and try again.`;
    case "conflict":
      return CONFLICT_MESSAGE;
    case "not_found":
      return `Couldn't ${verb}: this page no longer exists.`;
    case "bad_request":
    case "error":
      return `Couldn't ${verb} because something went wrong. Please try again.`;
  }
}

export function successMessage(kind: ActionKind, at: Date): string {
  const time = new Intl.DateTimeFormat("en-US", { timeStyle: "short", timeZone: "UTC" }).format(at);
  return kind === "save" ? `Saved at ${time} UTC.` : `Published at ${time} UTC.`;
}

export function feedbackFor(kind: ActionKind, result: PageActionResult, now: Date): ActionFeedback {
  return result.ok
    ? { tone: "success", message: successMessage(kind, now) }
    : { tone: "error", message: failureMessage(kind, result) };
}
