import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

/**
 * - `draft`: never published (no published snapshot).
 * - `published`: the published snapshot equals the saved draft.
 * - `unpublished-changes`: published, but the saved draft has changed since.
 */
export type PageStatus = "draft" | "published" | "unpublished-changes";

export function statusFrom(isPublished: boolean, draftMatchesPublished: boolean): PageStatus {
  if (!isPublished) return "draft";
  return draftMatchesPublished ? "published" : "unpublished-changes";
}

/**
 * Status of each page (optionally just one), computed in the database: the
 * draft/published comparison is jsonb equality, so neither content column is
 * transferred to the app.
 */
export async function loadPageStatuses(pageId?: string): Promise<Map<string, PageStatus>> {
  const scope = pageId ? { id: pageId } : {};
  const [published, inSync] = await Promise.all([
    db.page.findMany({
      where: { ...scope, publishedContent: { not: Prisma.AnyNull } },
      select: { id: true },
    }),
    db.page.findMany({
      where: { ...scope, publishedContent: { equals: db.page.fields.draftContent } },
      select: { id: true },
    }),
  ]);

  const inSyncIds = new Set(inSync.map((row) => row.id));
  return new Map(
    published.map((row) => [row.id, statusFrom(true, inSyncIds.has(row.id))] as const),
  );
}

/** Pages missing from the map are drafts (never published). */
export function statusOf(statuses: Map<string, PageStatus>, pageId: string): PageStatus {
  return statuses.get(pageId) ?? "draft";
}
