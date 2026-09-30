import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { RedirectError } from "@/features/auth/test-utils";
import { samplePageContent } from "@/features/sections/sample-page";
import { Prisma } from "@/generated/prisma/client";

import type * as AdminQueries from "./admin-queries";

const mockFindMany = jest.fn<(args: unknown) => Promise<unknown[]>>();
const mockFindUnique = jest.fn<(args: unknown) => Promise<unknown>>();
const mockRequireAdmin = jest.fn<() => Promise<unknown>>();
const DRAFT_FIELD = { $field: "draftContent" };

jest.mock("@/lib/db", () => ({
  db: {
    page: {
      findMany: (args: unknown) => mockFindMany(args),
      findUnique: (args: unknown) => mockFindUnique(args),
      fields: { draftContent: { $field: "draftContent" } },
    },
  },
}));
jest.mock("@/features/auth/session", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

// Loaded after the mocks above are registered; next/jest's SWC transform does
// not hoist `jest.mock` from @jest/globals.
let listDashboardPages: typeof AdminQueries.listDashboardPages;
let toDashboardPage: typeof AdminQueries.toDashboardPage;
let getPageForEditor: typeof AdminQueries.getPageForEditor;

beforeAll(async () => {
  ({ listDashboardPages, toDashboardPage, getPageForEditor } = await import(
    "./admin-queries"
  ));
});

const updatedA = new Date("2026-09-29T10:00:00Z");
const updatedB = new Date("2026-09-28T09:00:00Z");
const publishedAt = new Date("2026-09-27T08:00:00Z");

const rowA = { id: "a", name: "Page A", slug: "page-a", publishedAt, updatedAt: updatedA };
const rowB = { id: "b", name: "Page B", slug: "page-b", publishedAt: null, updatedAt: updatedB };

/**
 * Fakes the page table: `published` ids have a published snapshot, `inSync`
 * ids are those whose snapshot equals the draft. The status queries are told
 * apart by their `where`.
 */
function mockStatusQueries({
  rows = [] as unknown[],
  published = [] as string[],
  inSync = [] as string[],
} = {}) {
  mockFindMany.mockImplementation(async (args) => {
    const where = (args as { where?: { publishedContent?: unknown } }).where;
    if (!where) return rows;
    const publishedContent = where.publishedContent as { equals?: unknown } | undefined;
    const ids = publishedContent?.equals ? inSync : published;
    return ids.map((id) => ({ id }));
  });
}

beforeEach(() => {
  mockFindMany.mockReset();
  mockFindUnique.mockReset();
  mockRequireAdmin.mockReset();
  mockRequireAdmin.mockResolvedValue({ subject: "admin" });
});

describe("toDashboardPage", () => {
  it("shows the published date for published pages", () => {
    expect(toDashboardPage(rowA, "published")).toEqual({
      id: "a",
      name: "Page A",
      slug: "page-a",
      status: "published",
      publishedAt,
      updatedAt: updatedA,
    });
  });

  it("keeps the published date for pages with unpublished changes", () => {
    expect(toDashboardPage(rowA, "unpublished-changes")).toMatchObject({
      status: "unpublished-changes",
      publishedAt,
    });
  });

  it("hides publishedAt for drafts, even if a stale date is stored", () => {
    expect(toDashboardPage(rowB, "draft")).toMatchObject({ status: "draft", publishedAt: null });
    expect(toDashboardPage(rowA, "draft")).toMatchObject({ status: "draft", publishedAt: null });
  });
});

describe("listDashboardPages", () => {
  it("requires an admin session before querying", async () => {
    mockRequireAdmin.mockRejectedValue(new RedirectError("/login"));
    await expect(listDashboardPages()).rejects.toMatchObject({ url: "/login" });
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("selects only list fields, newest update first, without page content", async () => {
    mockStatusQueries();
    await listDashboardPages();

    expect(mockFindMany).toHaveBeenCalledWith({
      select: { id: true, name: true, slug: true, publishedAt: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    for (const [args] of mockFindMany.mock.calls) {
      const select = (args as { select: Record<string, boolean> }).select;
      expect(select).not.toHaveProperty("draftContent");
      expect(select).not.toHaveProperty("publishedContent");
    }
  });

  it("asks the database whether each snapshot is published and equals the draft", async () => {
    mockStatusQueries();
    await listDashboardPages();

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { publishedContent: { not: Prisma.AnyNull } },
      select: { id: true },
    });
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { publishedContent: { equals: DRAFT_FIELD } },
      select: { id: true },
    });
  });

  it("maps every page to draft, published, or unpublished changes", async () => {
    const rowC = { ...rowA, id: "c", name: "Page C", slug: "page-c" };
    mockStatusQueries({ rows: [rowA, rowB, rowC], published: ["a", "c"], inSync: ["a"] });

    expect(await listDashboardPages()).toEqual([
      toDashboardPage(rowA, "published"),
      toDashboardPage(rowB, "draft"),
      toDashboardPage(rowC, "unpublished-changes"),
    ]);
  });

  it("returns an empty list when there are no pages", async () => {
    mockStatusQueries();
    expect(await listDashboardPages()).toEqual([]);
  });
});

describe("getPageForEditor", () => {
  const version = new Date("2026-09-29T10:00:00.123Z");
  const row = { id: "p1", name: "Sample", slug: "sample", updatedAt: version };
  const pageInfo = { id: "p1", name: "Sample", slug: "sample", version: version.toISOString() };

  it("requires an admin session before querying", async () => {
    mockRequireAdmin.mockRejectedValue(new RedirectError("/login"));
    await expect(getPageForEditor("p1")).rejects.toMatchObject({ url: "/login" });
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("loads only the draft content, not the published snapshot", async () => {
    mockFindUnique.mockResolvedValue({ ...row, draftContent: samplePageContent });
    mockStatusQueries({ published: ["p1"], inSync: ["p1"] });
    await getPageForEditor("p1");

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: "p1" },
      select: { id: true, name: true, slug: true, draftContent: true, updatedAt: true },
    });
    // Status is computed from ids only, scoped to this page.
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { id: "p1", publishedContent: { not: Prisma.AnyNull } },
      select: { id: true },
    });
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { id: "p1", publishedContent: { equals: DRAFT_FIELD } },
      select: { id: true },
    });
  });

  it("returns null when the page does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockStatusQueries();
    expect(await getPageForEditor("missing")).toBeNull();
  });

  it("returns valid draft content with the version and status", async () => {
    mockFindUnique.mockResolvedValue({ ...row, draftContent: samplePageContent });
    mockStatusQueries();

    expect(await getPageForEditor("p1")).toEqual({
      kind: "ok",
      page: { ...pageInfo, status: "draft" },
      content: samplePageContent,
    });
  });

  it.each([
    ["published", { published: ["p1"], inSync: ["p1"] }],
    ["unpublished-changes", { published: ["p1"], inSync: [] }],
  ] as const)("reports %s pages", async (status, ids) => {
    mockFindUnique.mockResolvedValue({ ...row, draftContent: samplePageContent });
    mockStatusQueries({ published: [...ids.published], inSync: [...ids.inSync] });
    expect(await getPageForEditor("p1")).toMatchObject({ kind: "ok", page: { status } });
  });

  it("accepts draft content with empty editable strings", async () => {
    const draft = structuredClone(samplePageContent);
    draft.meta.title = "";
    mockFindUnique.mockResolvedValue({ ...row, draftContent: draft });
    mockStatusQueries({ published: ["p1"], inSync: ["p1"] });

    expect(await getPageForEditor("p1")).toMatchObject({
      kind: "ok",
      page: { status: "published" },
      content: { meta: { title: "" } },
    });
  });

  it("reports invalid stored content without its values", async () => {
    const invalid = structuredClone(samplePageContent) as unknown as {
      schemaVersion: number;
      sections: { data: { primaryButton: { href: string } } }[];
    };
    invalid.schemaVersion = 99;
    invalid.sections[0]!.data.primaryButton.href = "javascript:stored-secret";
    mockFindUnique.mockResolvedValue({ ...row, draftContent: invalid });
    mockStatusQueries();

    const result = await getPageForEditor("p1");
    expect(result).toMatchObject({ kind: "invalid", page: { ...pageInfo, status: "draft" } });
    if (result?.kind !== "invalid") throw new Error("expected invalid");
    expect(result.issues.map((issue) => issue.path)).toEqual(
      expect.arrayContaining(["schemaVersion", "sections.0.data.primaryButton.href"]),
    );
    expect(JSON.stringify(result.issues)).not.toContain("stored-secret");
    // Messages are the generic ones from describeStoredContentIssue.
    expect(result.issues).toContainEqual({
      path: "sections.0.data.primaryButton.href",
      message: "Invalid value",
    });
  });

  it("reports non-object content at the root", async () => {
    mockFindUnique.mockResolvedValue({ ...row, draftContent: null });
    mockStatusQueries();
    const result = await getPageForEditor("p1");
    expect(result).toMatchObject({ kind: "invalid", issues: [{ path: "(root)" }] });
  });
});
