import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageStatusBadge } from "@/features/dashboard/page-status-badge";
import type { EditorPage } from "@/features/pages/admin-queries";

import type { IssueCounts } from "./validation";

export const LEAVE_CONFIRMATION = "You have unsaved changes. Leave the editor and discard them?";
export const RESET_CONFIRMATION = "Discard all changes and restore the loaded content?";

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

export function EditorHeader({
  page,
  counts,
  dirty,
  onReset,
}: {
  page: EditorPage;
  counts: IssueCounts;
  dirty: boolean;
  onReset: () => void;
}) {
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
            <PageStatusBadge status={page.status} />
          </div>
          <p className="truncate font-mono text-xs text-muted-foreground">/p/{page.slug}</p>
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
          <p className="text-sm text-muted-foreground">
            {dirty ? "Unsaved changes · Saving isn't available yet" : "No changes"}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!dirty}
            onClick={() => {
              if (window.confirm(RESET_CONFIRMATION)) onReset();
            }}
          >
            Reset changes
          </Button>
        </div>
      </div>
    </header>
  );
}
