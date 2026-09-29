export const HREF_MAX_LENGTH = 2048;

// Whitespace, backslashes and control characters are never needed in an href
// and are common ingredients of scheme-smuggling tricks.
const FORBIDDEN_CHARACTERS = /[\s\\\u0000-\u001f\u007f]/;

/**
 * Returns true for hrefs that are safe to render in a public page:
 * `https:`/`http:` URLs with a host, `mailto:` links, `#anchors` and
 * root-relative `/paths`. Everything else (including `javascript:`,
 * `data:`, protocol-relative `//host` and bare relative paths) is rejected.
 */
export function isSafeHref(value: string): boolean {
  if (value.length === 0 || value.length > HREF_MAX_LENGTH) return false;
  if (FORBIDDEN_CHARACTERS.test(value)) return false;

  if (value.startsWith("#")) return true;
  if (value.startsWith("/")) return !value.startsWith("//");

  const lower = value.toLowerCase();
  if (lower.startsWith("mailto:")) return value.length > "mailto:".length;
  if (lower.startsWith("https://") || lower.startsWith("http://")) {
    try {
      const url = new URL(value);
      return (
        (url.protocol === "https:" || url.protocol === "http:") &&
        url.hostname !== ""
      );
    } catch {
      return false;
    }
  }

  return false;
}
