import "server-only";

import { cache } from "react";

import { requireAdmin } from "@/features/auth/session";
import {
  draftPageContentSchema,
  type PageContent,
} from "@/features/sections/page-content";
import { db } from "@/lib/db";

import { describeStoredContentIssue, type ContentIssue } from "./content-issues";
import { loadPageStatuses, statusOf, type PageStatus } from "./page-status";

export type { PageStatus };

export type DashboardPage = {
  id: string;
  name: string;
  slug: string;
  status: PageStatus;
  /** Only set for pages with a published snapshot. */
  publishedAt: Date | null;
  updatedAt: Date;
};

type DashboardPageRow = {
  id: string;
  name: string;
  slug: string;
  publishedAt: Date | null;
  updatedAt: Date;
};

/**
 * A page is published when it has a `publishedContent` snapshot — the same
 * rule the public /p/[slug] route uses. `publishedAt` alone is not trusted.
 */
export function toDashboardPage(row: DashboardPageRow, status: PageStatus): DashboardPage {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status,
    publishedAt: status === "draft" ? null : row.publishedAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Lists every page for the dashboard, most recently updated first.
 * Read-only. Requires an admin session (redirects to /login otherwise).
 * Page content JSON is never loaded or parsed here.
 */
export async function listDashboardPages(): Promise<DashboardPage[]> {
  await requireAdmin();

  const [rows, statuses] = await Promise.all([
    db.page.findMany({
      select: { id: true, name: true, slug: true, publishedAt: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    loadPageStatuses(),
  ]);

  return rows.map((row) => toDashboardPage(row, statusOf(statuses, row.id)));
}

export type EditorPage = {
  id: string;
  name: string;
  slug: string;
  status: PageStatus;
  /**
   * The page's `updatedAt` (ISO string) when loaded. Saves and publishes send
   * it back so a stale editor cannot overwrite newer changes.
   */
  version: string;
};

export type { ContentIssue };

export type EditorPageResult =
  | { kind: "ok"; page: EditorPage; content: PageContent }
  | { kind: "invalid"; page: EditorPage; issues: ContentIssue[] };

/**
 * Loads a page's draft content for the editor. Read-only: invalid stored
 * content is reported, never repaired or overwritten. Returns null when the
 * page does not exist. Requires an admin session. Memoized per request so
 * `generateMetadata` and the page share one lookup.
 */
export const getPageForEditor = cache(
  async (id: string): Promise<EditorPageResult | null> => {
    await requireAdmin();

    const [row, statuses] = await Promise.all([
      db.page.findUnique({
        where: { id },
        select: { id: true, name: true, slug: true, draftContent: true, updatedAt: true },
      }),
      // Status only; the published snapshot itself is not loaded.
      loadPageStatuses(id),
    ]);
    if (!row) return null;

    const page: EditorPage = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: statusOf(statuses, row.id),
      version: row.updatedAt.toISOString(),
    };

    const parsed = draftPageContentSchema.safeParse(row.draftContent);
    if (!parsed.success) {
      // Generic messages only; stored values are never echoed back.
      const issues = parsed.error.issues.map(describeStoredContentIssue);
      return { kind: "invalid", page, issues };
    }

    return { kind: "ok", page, content: parsed.data };
  },
);
