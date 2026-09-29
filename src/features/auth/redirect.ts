export const DEFAULT_REDIRECT_PATH = "/dashboard";

const LOGIN_PATH = "/login";
const MAX_LENGTH = 2048;
// Backslashes are treated as slashes by browsers (`/\evil.com` → `//evil.com`).
const FORBIDDEN_CHARACTERS = /[\u0000-\u001f\u007f\\]/;
const BASE = "http://internal.invalid";

/**
 * Returns `value` if it is a same-origin path (e.g. `/dashboard?tab=1`),
 * otherwise the default destination. Prevents open redirects via `?next=`.
 */
export function safeRedirectPath(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_LENGTH) {
    return DEFAULT_REDIRECT_PATH;
  }
  if (!value.startsWith("/") || value.startsWith("//")) return DEFAULT_REDIRECT_PATH;
  if (FORBIDDEN_CHARACTERS.test(value)) return DEFAULT_REDIRECT_PATH;

  let url: URL;
  try {
    url = new URL(value, BASE);
  } catch {
    return DEFAULT_REDIRECT_PATH;
  }
  if (url.origin !== BASE) return DEFAULT_REDIRECT_PATH;
  // Never send a signed-in user back to the login page.
  if (url.pathname === LOGIN_PATH) return DEFAULT_REDIRECT_PATH;

  return `${url.pathname}${url.search}${url.hash}`;
}
