import { z } from "zod";

import { HREF_MAX_LENGTH, isSafeHref } from "./url";

/**
 * `draft` accepts empty editable strings so unfinished content can be saved.
 * `publish` requires real content. Structure, max lengths and item counts are
 * identical in both modes.
 */
export type ValidationMode = "draft" | "publish";

export const LABEL_MAX_LENGTH = 30;

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export const idSchema = z
  .string()
  .regex(ID_PATTERN, "Must be 1–64 letters, digits, hyphens or underscores");

/** Text that must be filled in before publishing. */
export function requiredText(mode: ValidationMode, max: number) {
  const base = z.string().max(max);
  return mode === "publish"
    ? base.refine((value) => value.trim().length > 0, "Required")
    : base;
}

/** Text that may be left empty or omitted, even when publishing. */
export function optionalText(max: number) {
  return z.string().max(max).optional();
}

export function href(mode: ValidationMode) {
  return z
    .string()
    .max(HREF_MAX_LENGTH)
    .refine(
      (value) => (mode === "draft" && value === "") || isSafeHref(value),
      "Must be an https:, http: or mailto: URL, a #anchor or a /path",
    );
}

export function linkSchema(mode: ValidationMode) {
  return z.strictObject({
    label: requiredText(mode, LABEL_MAX_LENGTH),
    href: href(mode),
  });
}

/** Rejects lists where two entries share an `id`. */
export function uniqueIds(items: readonly { id: string }[], ctx: z.RefinementCtx) {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    if (seen.has(item.id)) {
      ctx.addIssue({
        code: "custom",
        message: `Duplicate id "${item.id}"`,
        path: [index, "id"],
      });
    }
    seen.add(item.id);
  });
}

/** A list of items with stable, unique ids and an item count range. */
export function itemList<T extends z.ZodType<{ id: string }>>(
  item: T,
  min: number,
  max: number,
) {
  return z.array(item).min(min).max(max).superRefine(uniqueIds);
}
