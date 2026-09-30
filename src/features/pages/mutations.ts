import "server-only";

import {
  draftPageContentSchema,
  publishPageContentSchema,
} from "@/features/sections/page-content";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

import { describeStoredContentIssue, type ContentIssue } from "./content-issues";
import { loadPageStatuses, statusOf, type PageStatus } from "./page-status";

// Database writes for the editor. Callers (Server Actions) must check admin
// authorization first. Every write is a single conditional UPDATE on
// `updatedAt`, so an editor holding stale content cannot overwrite newer
// changes (optimistic concurrency; no locking or history).

export type MutationSuccess = {
  ok: true;
  /** The page's new `updatedAt` (ISO); send it with the next save/publish. */
  version: string;
  status: PageStatus;
  /** ISO timestamp of the latest publish, or null if never published. */
  publishedAt: string | null;
};

export type MutationFailure =
  | { ok: false; reason: "invalid"; issues: ContentIssue[] }
  | { ok: false; reason: "conflict" | "not_found" };

export type MutationResult = MutationSuccess | MutationFailure;

const RESULT_SELECT = { updatedAt: true, publishedAt: true } as const;

function isRecordNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

/** Distinguishes a stale version from a deleted page after a failed update. */
async function failureFor(pageId: string): Promise<MutationFailure> {
  const exists = (await db.page.count({ where: { id: pageId } })) > 0;
  return { ok: false, reason: exists ? "conflict" : "not_found" };
}

async function success(
  pageId: string,
  row: { updatedAt: Date; publishedAt: Date | null },
): Promise<MutationSuccess> {
  const status = statusOf(await loadPageStatuses(pageId), pageId);
  return {
    ok: true,
    version: row.updatedAt.toISOString(),
    status,
    publishedAt: status === "draft" ? null : (row.publishedAt?.toISOString() ?? null),
  };
}

/**
 * Validates `content` with the draft schema and stores it as the page's draft.
 * The published snapshot and `publishedAt` are never touched.
 */
export async function saveDraft({
  pageId,
  content,
  expectedVersion,
}: {
  pageId: string;
  content: unknown;
  expectedVersion: Date;
}): Promise<MutationResult> {
  const parsed = draftPageContentSchema.safeParse(content);
  if (!parsed.success) {
    return { ok: false, reason: "invalid", issues: parsed.error.issues.map(describeStoredContentIssue) };
  }

  try {
    const row = await db.page.update({
      where: { id: pageId, updatedAt: expectedVersion },
      data: { draftContent: parsed.data },
      select: RESULT_SELECT,
    });
    return success(pageId, row);
  } catch (error) {
    if (isRecordNotFound(error)) return failureFor(pageId);
    throw error;
  }
}

/**
 * Publishes the page's saved draft (never content from the client): it must
 * pass the publish schema, and the page must be unchanged since
 * `expectedVersion`. The draft is left as it is.
 */
export async function publishSavedDraft({
  pageId,
  expectedVersion,
}: {
  pageId: string;
  expectedVersion: Date;
}): Promise<MutationResult> {
  const page = await db.page.findUnique({
    where: { id: pageId },
    select: { draftContent: true, updatedAt: true },
  });
  if (!page) return { ok: false, reason: "not_found" };
  if (page.updatedAt.getTime() !== expectedVersion.getTime()) {
    return { ok: false, reason: "conflict" };
  }

  const parsed = publishPageContentSchema.safeParse(page.draftContent);
  if (!parsed.success) {
    return { ok: false, reason: "invalid", issues: parsed.error.issues.map(describeStoredContentIssue) };
  }

  try {
    // Conditional on the version just read: if the draft changed in between,
    // nothing is published.
    const row = await db.page.update({
      where: { id: pageId, updatedAt: page.updatedAt },
      data: { publishedContent: parsed.data, publishedAt: new Date() },
      select: RESULT_SELECT,
    });
    return success(pageId, row);
  } catch (error) {
    if (isRecordNotFound(error)) return failureFor(pageId);
    throw error;
  }
}
