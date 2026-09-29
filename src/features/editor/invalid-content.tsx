import Link from "next/link";

import type { ContentIssue, EditorPage } from "@/features/pages/admin-queries";

const MAX_LISTED = 20;

/**
 * Shown instead of the editor when stored draft content fails validation.
 * Read-only: the content is never repaired or overwritten.
 */
export function InvalidContent({ page, issues }: { page: EditorPage; issues: ContentIssue[] }) {
  const listed = issues.slice(0, MAX_LISTED);
  const hidden = issues.length - listed.length;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
      <Link
        href="/dashboard"
        className="text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <span aria-hidden="true">← </span>Pages
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">
        “{page.name}” can’t be edited
      </h1>
      <p className="mt-3 text-muted-foreground">
        The stored draft content doesn’t match the expected page format, so the editor
        can’t open it safely. Nothing has been changed.
      </p>
      <h2 className="mt-8 text-sm font-semibold">
        {issues.length} {issues.length === 1 ? "problem" : "problems"} found
      </h2>
      <ul className="mt-3 divide-y rounded-lg border text-sm">
        {listed.map((issue, index) => (
          <li key={index} className="px-4 py-2">
            <code className="font-mono text-xs break-all">{issue.path}</code>
            <span className="text-muted-foreground"> — {issue.message}</span>
          </li>
        ))}
      </ul>
      {hidden > 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">and {hidden} more.</p>
      ) : null}
    </main>
  );
}
