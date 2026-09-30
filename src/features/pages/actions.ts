"use server";

import { z } from "zod";

import { requireAdmin } from "@/features/auth/session";

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
