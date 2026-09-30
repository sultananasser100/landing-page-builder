"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/features/auth/session";

import { createPage } from "./create-page";
import {
  CREATE_FAILED,
  createPageInputSchema,
  SLUG_TAKEN,
  type CreatePageErrors,
  type CreatePageState,
} from "./create-page-input";
import { publishSavedDraft, saveDraft, type MutationResult } from "./mutations";

// Editor mutations. Each action checks the admin session before anything else
// (requireAdmin redirects to /login otherwise) and validates its input on the
// server; nothing from the client is trusted.

export type PageActionResult =
  | MutationResult
  | { ok: false; reason: "bad_request" | "error" };

const targetSchema = z.object({
  pageId: z.string().min(1).max(128),
  expectedVersion: z.iso.datetime(),
});

export async function savePageDraft(input: {
  pageId: string;
  expectedVersion: string;
  content: unknown;
}): Promise<PageActionResult> {
  await requireAdmin();

  const target = targetSchema.safeParse(input);
  if (!target.success) return { ok: false, reason: "bad_request" };

  try {
    return await saveDraft({
      pageId: target.data.pageId,
      expectedVersion: new Date(target.data.expectedVersion),
      content: input.content,
    });
  } catch (error) {
    console.error("[pages] Failed to save draft", error);
    return { ok: false, reason: "error" };
  }
}

export async function publishPage(input: {
  pageId: string;
  expectedVersion: string;
}): Promise<PageActionResult> {
  await requireAdmin();

  const target = targetSchema.safeParse(input);
  if (!target.success) return { ok: false, reason: "bad_request" };

  try {
    return await publishSavedDraft({
      pageId: target.data.pageId,
      expectedVersion: new Date(target.data.expectedVersion),
    });
  } catch (error) {
    console.error("[pages] Failed to publish page", error);
    return { ok: false, reason: "error" };
  }
}

/**
 * Form action for the New page screen: creates a draft page from a template and
 * redirects to its editor. Returns field errors instead when the input is
 * invalid or the slug is taken.
 */
export async function createPageFromTemplate(
  _previousState: CreatePageState,
  formData: FormData,
): Promise<CreatePageState> {
  await requireAdmin();

  const parsed = createPageInputSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    templateId: formData.get("templateId"),
  });
  if (!parsed.success) {
    const errors: CreatePageErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "name" || field === "slug" || field === "templateId") {
        errors[field] ??= issue.message;
      }
    }
    return { errors };
  }

  let id: string;
  try {
    const result = await createPage(parsed.data);
    if (!result.ok) return { errors: { slug: SLUG_TAKEN } };
    id = result.id;
  } catch (error) {
    console.error("[pages] Failed to create page", error);
    return { errors: { form: CREATE_FAILED } };
  }

  // Outside the try block: redirect() works by throwing.
  redirect(`/dashboard/pages/${id}`);
}
