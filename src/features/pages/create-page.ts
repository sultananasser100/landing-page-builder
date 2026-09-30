import "server-only";

import { draftPageContentSchema } from "@/features/sections/page-content";
import { templates } from "@/features/templates/templates";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

import type { CreatePageInput } from "./create-page-input";

export type CreatePageResult =
  | { ok: true; id: string }
  | { ok: false; reason: "slug_taken" };

/**
 * Creates a never-published draft page from a template. `input` must already
 * be validated (see `createPageInputSchema`); callers must check admin
 * authorization first. The slug is unique in the database, so a taken slug is
 * reported rather than changed.
 */
export async function createPage(input: CreatePageInput): Promise<CreatePageResult> {
  // Defense in depth: template content must always be a valid draft.
  const content = draftPageContentSchema.parse(templates[input.templateId].createContent());

  try {
    const page = await db.page.create({
      data: { name: input.name, slug: input.slug, draftContent: content },
      select: { id: true },
    });
    return { ok: true, id: page.id };
  } catch (error) {
    if (isSlugConflict(error)) return { ok: false, reason: "slug_taken" };
    throw error;
  }
}

// `slug` is the only unique column besides the generated id, so any unique
// violation here is a taken slug. (With the pg driver adapter `meta.target` is
// not reliably present, so it is not inspected.)
function isSlugConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
