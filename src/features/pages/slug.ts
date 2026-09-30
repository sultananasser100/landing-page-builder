/** Longest allowed public slug (`/p/{slug}`). */
export const SLUG_MAX_LENGTH = 60;

/** Longest allowed internal page name. */
export const PAGE_NAME_MAX_LENGTH = 100;

/** Lowercase letters, digits and hyphens. */
export const SLUG_PATTERN = /^[a-z0-9-]+$/;

/**
 * Suggests a slug from a page name: lowercase ASCII letters and digits with
 * single hyphens between words, at most `SLUG_MAX_LENGTH` characters. Accents
 * are dropped from letters; anything else that is not a letter or digit acts
 * as a separator. May return an empty string.
 */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/, "");
}
