import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageStatusBadge } from "@/features/dashboard/page-status-badge";
import type { EditorPage, PageStatus } from "@/features/pages/admin-queries";

import type { IssueCounts } from "./validation";

export const LEAVE_CONFIRMATION = "You have unsaved changes. Leave the editor and discard them?";
export const RESET_CONFIRMATION =
  "Discard your unsaved changes and restore the last saved version?";

/** Result of the latest save/publish attempt, shown in the header. */
export type ActionFeedback = { tone: "success" | "error"; message: string } | null;

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function validationSummary({ errors, publish }: IssueCounts): string {
  if (errors === 0 && publish === 0) return "All required content is filled in";
  const parts: string[] = [];
  if (errors > 0) parts.push(plural(errors, "error", "errors"));
  if (publish > 0) parts.push(`${publish} needed to publish`);
  return parts.join(" · ");
}

/** What the admin can do right now, and why not (shown as a hint). */
export function actionAvailability({
  dirty,
  counts,
  pending,
}: {
  dirty: boolean;
  counts: IssueCounts;
  pending: boolean;
}): { canSave: boolean; canPublish: boolean; publishHint: string | null } {
  const canSave = dirty && counts.errors === 0 && !pending;
  let publishHint: string | null = null;
  if (dirty) publishHint = "Save your changes before publishing.";
  else if (counts.errors > 0) publishHint = "Fix the errors before publishing.";
  else if (counts.publish > 0) publishHint = "Fill in the required content before publishing.";
  return { canSave, canPublish: publishHint === null && !pending, publishHint };
}

export function saveStateText(dirty: boolean, status: PageStatus): string {
  if (dirty) return "Unsaved changes";
  return status === "unpublished-changes" ? "All changes saved · not yet published" : "All changes saved";
}

export function EditorHeader({
  page,
  status,
  counts,
  dirty,
  pending,
  feedback,
  onSave,
  onPublish,
  onReset,
}: {
  page: EditorPage;
  status: PageStatus;
  counts: IssueCounts;
  dirty: boolean;
  /** A save or publish is in progress. */
  pending: boolean;
  feedback: ActionFeedback;
  onSave: () => void;
  onPublish: () => void;
  onReset: () => void;
}) {
  const { canSave, canPublish, publishHint } = actionAvailability({ dirty, counts, pending });
  const hintId = "publish-hint";

  return (
    <header className="border-b bg-background">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link
          href="/dashboard"
          onClick={(event) => {
            // In-app navigation does not trigger `beforeunload`.
            if (dirty && !window.confirm(LEAVE_CONFIRMATION)) event.preventDefault();
          }}
          className="shrink-0 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span aria-hidden="true">← </span>Pages
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="min-w-0 truncate text-base font-semibold">{page.name}</h1>
            <PageStatusBadge status={status} />
          </div>
          <p className="truncate font-mono text-xs text-muted-foreground">
            /p/{page.slug}
            {status !== "draft" ? (
              <>
                {" · "}
                <a
                  href={`/p/${page.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  View live<span className="sr-only"> (opens in a new tab)</span>
                  <span aria-hidden="true"> ↗</span>
                </a>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p
            role="status"
            className={
              counts.errors > 0
                ? "text-sm text-destructive"
                : counts.publish > 0
                  ? "text-sm text-amber-700 dark:text-amber-400"
                  : "text-sm text-muted-foreground"
            }
          >
            {validationSummary(counts)}
          </p>
          <p className="text-sm text-muted-foreground">{saveStateText(dirty, status)}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!dirty || pending}
            onClick={() => {
              if (window.confirm(RESET_CONFIRMATION)) onReset();
            }}
          >
            Reset changes
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={!canSave} onClick={onSave}>
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!canPublish}
            aria-describedby={publishHint ? hintId : undefined}
            onClick={onPublish}
          >
            Publish
          </Button>
        </div>
      </div>

      {publishHint ? (
        <p id={hintId} className="px-4 pb-2 text-right text-xs text-muted-foreground">
          {publishHint}
        </p>
      ) : null}
      <p
        role="status"
        aria-live="polite"
        data-testid="action-feedback"
        className={
          feedback?.tone === "error"
            ? "px-4 pb-2 text-right text-sm text-destructive"
            : feedback
              ? "px-4 pb-2 text-right text-sm text-muted-foreground"
              : "sr-only"
        }
      >
        {feedback?.message}
      </p>
    </header>
  );
}
