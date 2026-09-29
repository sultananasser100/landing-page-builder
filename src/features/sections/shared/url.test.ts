import { describe, expect, it } from "@jest/globals";

import { HREF_MAX_LENGTH, isSafeHref } from "./url";

describe("isSafeHref", () => {
  it.each([
    "https://example.com",
    "https://example.com/pricing?plan=team#top",
    "HTTPS://EXAMPLE.COM",
    "http://localhost:3000/path",
    "mailto:hello@example.com",
    "mailto:hello@example.com?subject=Hi%20there",
    "#",
    "#pricing",
    "/",
    "/signup",
    "/docs/getting-started?ref=home#install",
  ])("allows %s", (href) => {
    expect(isSafeHref(href)).toBe(true);
  });

  it.each([
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "JAVASCRIPT:alert(1)",
    " javascript:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "javascript&colon;alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "ftp://example.com",
    "tel:+15555555555",
    "//evil.example.com",
    "/\\evil.example.com",
    "https:evil.example.com",
    "https://",
    "mailto:",
    "example.com",
    "relative/path",
    "./path",
    "",
    "https://example.com/has space",
  ])("rejects %j", (href) => {
    expect(isSafeHref(href)).toBe(false);
  });

  it("rejects hrefs over the maximum length", () => {
    const base = "https://example.com/";
    expect(isSafeHref(base + "a".repeat(HREF_MAX_LENGTH - base.length))).toBe(true);
    expect(isSafeHref(base + "a".repeat(HREF_MAX_LENGTH - base.length + 1))).toBe(
      false,
    );
  });
});
