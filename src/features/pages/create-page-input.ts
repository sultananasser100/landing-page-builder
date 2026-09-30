import { z } from "zod";

import { TEMPLATE_IDS } from "@/features/templates/template-ids";

import { PAGE_NAME_MAX_LENGTH, SLUG_MAX_LENGTH, SLUG_PATTERN } from "./slug";

// Shared by the New page form (client) and the server action, so it must not
// import server-only code.

export const NAME_REQUIRED = "Enter a page name.";
export const NAME_TOO_LONG = `Use at most ${PAGE_NAME_MAX_LENGTH} characters.`;
export const SLUG_REQUIRED = "Enter a URL slug.";
export const SLUG_TOO_LONG = `Use at most ${SLUG_MAX_LENGTH} characters.`;
export const SLUG_INVALID = "Use only lowercase letters, digits and hyphens.";
export const SLUG_TAKEN = "This URL slug is already in use. Choose a different one.";
export const TEMPLATE_INVALID = "Choose a template.";
export const CREATE_FAILED = "The page could not be created. Try again.";

export const createPageInputSchema = z.object({
  name: z
    .string(NAME_REQUIRED)
    .trim()
    .min(1, NAME_REQUIRED)
    .max(PAGE_NAME_MAX_LENGTH, NAME_TOO_LONG),
  slug: z
    .string(SLUG_REQUIRED)
    .min(1, SLUG_REQUIRED)
    .max(SLUG_MAX_LENGTH, SLUG_TOO_LONG)
    .regex(SLUG_PATTERN, SLUG_INVALID),
  templateId: z.enum(TEMPLATE_IDS, TEMPLATE_INVALID),
});

export type CreatePageInput = z.infer<typeof createPageInputSchema>;

export type CreatePageErrors = {
  name?: string;
  slug?: string;
  templateId?: string;
  /** Not tied to a field. */
  form?: string;
};

export type CreatePageState = {
  errors: CreatePageErrors;
};

export const initialCreatePageState: CreatePageState = { errors: {} };
