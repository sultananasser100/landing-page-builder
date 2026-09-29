import { describe, expect, it } from "@jest/globals";

import { DEFAULT_REDIRECT_PATH, safeRedirectPath } from "./redirect";

describe("safeRedirectPath", () => {
  it.each([
    ["/dashboard", "/dashboard"],
    ["/dashboard/pages/abc", "/dashboard/pages/abc"],
    ["/dashboard?tab=pages", "/dashboard?tab=pages"],
    ["/dashboard#top", "/dashboard#top"],
    ["/", "/"],
    ["/dashboard/../p/sample", "/p/sample"],
  ])("allows internal path %j", (value, expected) => {
    expect(safeRedirectPath(value)).toBe(expected);
  });

  it.each([
    undefined,
    null,
    42,
    ["/dashboard"],
    "",
    "dashboard",
    "./dashboard",
    "https://evil.example.com",
    "http://evil.example.com/dashboard",
    "//evil.example.com",
    "///evil.example.com",
    "/\\evil.example.com",
    "\\\\evil.example.com",
    "/dashboard\\..\\evil",
    "javascript:alert(1)",
    "JAVASCRIPT:alert(1)",
    "data:text/html,x",
    "mailto:a@example.com",
    " /dashboard",
    "/\t/evil.example.com",
    "/\n/evil.example.com",
    "/dash\u0000board",
    "/dash\u007fboard",
    "/login",
    "/login?next=/dashboard",
    "/" + "a".repeat(2048),
  ])("rejects %p", (value) => {
    expect(safeRedirectPath(value)).toBe(DEFAULT_REDIRECT_PATH);
  });

  it("defaults to /dashboard", () => {
    expect(DEFAULT_REDIRECT_PATH).toBe("/dashboard");
  });
});
