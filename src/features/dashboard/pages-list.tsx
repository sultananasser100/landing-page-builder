import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { DashboardPage } from "@/features/pages/admin-queries";

import { formatDateTimeUtc } from "./format";
import { PageStatusBadge } from "./page-status-badge";

function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function DateTime({ date }: { date: Date }) {
  return <time dateTime={date.toISOString()}>{formatDateTimeUtc(date)}</time>;
}

export function PagesList({ pages }: { pages: DashboardPage[] }) {
  if (pages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-16 text-center">
        <h2 className="text-lg font-semibold">No pages yet</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Landing pages will be listed here with their status and public URL.
        </p>
      </div>
    );
  }

  const publishedCount = pages.filter((page) => page.status !== "draft").length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {pluralize(pages.length, "page", "pages")} · {publishedCount} published
      </p>
      <ul className="divide-y rounded-xl border bg-card">
        {pages.map((page) => (
          <PageRow key={page.id} page={page} />
        ))}
      </ul>
    </div>
  );
}

function PageRow({ page }: { page: DashboardPage }) {
  const publicPath = `/p/${page.slug}`;

  return (
    <li className="grid gap-3 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-6">
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="min-w-0 text-base font-semibold break-words">{page.name}</h2>
          <PageStatusBadge status={page.status} />
        </div>
        <p className="font-mono text-sm break-all text-muted-foreground">{publicPath}</p>
        <p className="text-xs text-muted-foreground">
          Updated <DateTime date={page.updatedAt} />
          {page.publishedAt ? (
            <>
              {" · "}Published <DateTime date={page.publishedAt} />
            </>
          ) : null}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          href={`/dashboard/pages/${page.id}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Edit<span className="sr-only"> {page.name}</span>
        </Link>
        {page.status !== "draft" ? (
          <a
            href={publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            View live<span className="sr-only">: {page.name} (opens in a new tab)</span>
            <span aria-hidden="true"> ↗</span>
          </a>
        ) : null}
      </div>
    </li>
  );
}
