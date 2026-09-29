import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";

import { RedirectError } from "@/features/auth/test-utils";
import type { EditorPageResult } from "@/features/pages/admin-queries";
import { samplePageContent } from "@/features/sections/sample-page";

import type * as PageModule from "./page";

class NotFoundError extends Error {}

const calls: string[] = [];
const mockRequireAdmin = jest.fn<() => Promise<unknown>>();
const mockGetPageForEditor = jest.fn<(id: string) => Promise<EditorPageResult | null>>();

jest.mock("@/features/auth/session", () => ({
  requireAdmin: () => {
    calls.push("requireAdmin");
    return mockRequireAdmin();
  },
}));
jest.mock("@/features/pages/admin-queries", () => ({
  getPageForEditor: (id: string) => {
    calls.push(`getPageForEditor:${id}`);
    return mockGetPageForEditor(id);
  },
}));
jest.mock("next/navigation", () => ({
  notFound: () => {
    throw new NotFoundError("NEXT_NOT_FOUND");
  },
}));

// Loaded after the mocks above are registered; next/jest's SWC transform does
// not hoist `jest.mock` from @jest/globals.
let EditPagePage: typeof PageModule.default;
let generateMetadata: typeof PageModule.generateMetadata;

beforeAll(async () => {
  ({ default: EditPagePage, generateMetadata } = await import("./page"));
});

const page = { id: "p1", name: "Sample SaaS page", slug: "sample", status: "draft" as const };
const props = (id: string) =>
  ({ params: Promise.resolve({ id }), searchParams: Promise.resolve({}) }) as PageProps<"/dashboard/pages/[id]">;

beforeEach(() => {
  calls.length = 0;
  mockRequireAdmin.mockReset();
  mockRequireAdmin.mockResolvedValue({ subject: "admin" });
  mockGetPageForEditor.mockReset();
});

describe("editor page", () => {
  it("checks the admin session before loading the page", async () => {
    mockGetPageForEditor.mockResolvedValue({ kind: "ok", page, content: samplePageContent });
    await EditPagePage(props("p1"));
    expect(calls).toEqual(["requireAdmin", "getPageForEditor:p1"]);
  });

  it("does not load anything when the visitor is not signed in", async () => {
    mockRequireAdmin.mockRejectedValue(new RedirectError("/login"));
    await expect(EditPagePage(props("p1"))).rejects.toMatchObject({ url: "/login" });
    expect(mockGetPageForEditor).not.toHaveBeenCalled();
  });

  it("returns not found for unknown pages", async () => {
    mockGetPageForEditor.mockResolvedValue(null);
    await expect(EditPagePage(props("missing"))).rejects.toBeInstanceOf(NotFoundError);
  });

  it("renders the editor with the loaded draft content", async () => {
    mockGetPageForEditor.mockResolvedValue({ kind: "ok", page, content: samplePageContent });
    const html = renderToStaticMarkup(await EditPagePage(props("p1")));

    expect(html).toMatch(/<h1[^>]*>Sample SaaS page<\/h1>/);
    expect(html).toContain('<aside aria-label="Inspector"');
    expect(html).toContain("Plan less. Ship more.");
  });

  it("shows the invalid-content panel instead of the editor", async () => {
    mockGetPageForEditor.mockResolvedValue({
      kind: "invalid",
      page,
      issues: [{ path: "schemaVersion", message: "Invalid input: expected 1" }],
    });
    const html = renderToStaticMarkup(await EditPagePage(props("p1")));

    expect(html).toContain("can’t be edited");
    expect(html).toContain("schemaVersion");
    expect(html).not.toContain('aria-label="Inspector"');
  });
});

describe("generateMetadata", () => {
  it("titles the editor after the page", async () => {
    mockGetPageForEditor.mockResolvedValue({ kind: "ok", page, content: samplePageContent });
    expect(await generateMetadata(props("p1"))).toEqual({
      title: "Edit Sample SaaS page",
    });
  });

  it("uses a not-found title for unknown pages", async () => {
    mockGetPageForEditor.mockResolvedValue(null);
    expect(await generateMetadata(props("missing"))).toEqual({
      title: "Page not found",
    });
  });
});
