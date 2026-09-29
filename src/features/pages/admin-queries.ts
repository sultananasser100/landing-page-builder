import "server-only";

import { requireAdmin } from "@/features/auth/session";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export type PageStatus = "published" | "draft";

export type DashboardPage = {
  id: string;
  name: string;
  slug: string;
  status: PageStatus;
  /** Only set for published pages. */
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
export function toDashboardPage(row: DashboardPageRow, isPublished: boolean): DashboardPage {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: isPublished ? "published" : "draft",
    publishedAt: isPublished ? row.publishedAt : null,
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

  const [rows, publishedRows] = await Promise.all([
    db.page.findMany({
      select: { id: true, name: true, slug: true, publishedAt: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    // Only ids, so published snapshots are not transferred.
    db.page.findMany({
      where: { publishedContent: { not: Prisma.AnyNull } },
      select: { id: true },
    }),
  ]);

  const publishedIds = new Set(publishedRows.map((row) => row.id));
  return rows.map((row) => toDashboardPage(row, publishedIds.has(row.id)));
}
