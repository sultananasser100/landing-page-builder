import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { RedirectError } from "@/features/auth/test-utils";
import { samplePageContent } from "@/features/sections/sample-page";
import { Prisma } from "@/generated/prisma/client";

import type * as AdminQueries from "./admin-queries";

const mockFindMany = jest.fn<(args: unknown) => Promise<unknown[]>>();
const mockFindUnique = jest.fn<(args: unknown) => Promise<unknown>>();
const mockCount = jest.fn<(args: unknown) => Promise<number>>();
const mockRequireAdmin = jest.fn<() => Promise<unknown>>();

jest.mock("@/lib/db", () => ({
  db: {
    page: {
      findMany: (args: unknown) => mockFindMany(args),
      findUnique: (args: unknown) => mockFindUnique(args),
      count: (args: unknown) => mockCount(args),
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

beforeEach(() => {
  mockFindMany.mockReset();
  mockFindUnique.mockReset();
  mockCount.mockReset();
  mockRequireAdmin.mockReset();
  mockRequireAdmin.mockResolvedValue({ subject: "admin" });
});

describe("toDashboardPage", () => {
  it("marks pages with a published snapshot as published", () => {
    expect(toDashboardPage(rowA, true)).toEqual({
      id: "a",
      name: "Page A",
      slug: "page-a",
      status: "published",
      publishedAt,
      updatedAt: updatedA,
    });
  });

  it("marks pages without a published snapshot as draft", () => {
    expect(toDashboardPage(rowB, false)).toMatchObject({ status: "draft", publishedAt: null });
  });

  it("treats publishedAt without a snapshot (unpublished) as draft and hides the date", () => {
    expect(toDashboardPage(rowA, false)).toMatchObject({ status: "draft", publishedAt: null });
  });
});

describe("listDashboardPages", () => {
  function mockQueries(rows: unknown[], publishedIds: string[]) {
    mockFindMany.mockImplementation(async (args) =>
      (args as { where?: unknown }).where ? publishedIds.map((id) => ({ id })) : rows,
    );
  }

  it("requires an admin session before querying", async () => {
    mockRequireAdmin.mockRejectedValue(new RedirectError("/login"));
    await expect(listDashboardPages()).rejects.toMatchObject({ url: "/login" });
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("selects only list fields, newest update first, without page content", async () => {
    mockQueries([], []);
    await listDashboardPages();

    expect(mockFindMany).toHaveBeenCalledWith({
      select: { id: true, name: true, slug: true, publishedAt: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { publishedContent: { not: Prisma.AnyNull } },
      select: { id: true },
    });
    for (const [args] of mockFindMany.mock.calls) {
      const select = (args as { select: Record<string, boolean> }).select;
      expect(select).not.toHaveProperty("draftContent");
      expect(select).not.toHaveProperty("publishedContent");
    }
  });

  it("maps rows in query order with their status", async () => {
    mockQueries([rowA, rowB], ["a"]);
    expect(await listDashboardPages()).toEqual([
      toDashboardPage(rowA, true),
      toDashboardPage(rowB, false),
    ]);
  });

  it("returns an empty list when there are no pages", async () => {
    mockQueries([], []);
    expect(await listDashboardPages()).toEqual([]);
  });
});

describe("getPageForEditor", () => {
  const row = { id: "p1", name: "Sample", slug: "sample" };

  it("requires an admin session before querying", async () => {
    mockRequireAdmin.mockRejectedValue(new RedirectError("/login"));
    await expect(getPageForEditor("p1")).rejects.toMatchObject({ url: "/login" });
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockCount).not.toHaveBeenCalled();
  });

  it("loads only the draft content, not the published snapshot", async () => {
    mockFindUnique.mockResolvedValue({ ...row, draftContent: samplePageContent });
    mockCount.mockResolvedValue(1);
    await getPageForEditor("p1");

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: "p1" },
      select: { id: true, name: true, slug: true, draftContent: true },
    });
    expect(mockCount).toHaveBeenCalledWith({
      where: { id: "p1", publishedContent: { not: Prisma.AnyNull } },
    });
  });

  it("returns null when the page does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCount.mockResolvedValue(0);
    expect(await getPageForEditor("missing")).toBeNull();
  });

  it("returns valid draft content with the page status", async () => {
    mockFindUnique.mockResolvedValue({ ...row, draftContent: samplePageContent });
    mockCount.mockResolvedValue(0);

    expect(await getPageForEditor("p1")).toEqual({
      kind: "ok",
      page: { ...row, status: "draft" },
      content: samplePageContent,
    });
  });

  it("accepts draft content with empty editable strings", async () => {
    const draft = structuredClone(samplePageContent);
    draft.meta.title = "";
    mockFindUnique.mockResolvedValue({ ...row, draftContent: draft });
    mockCount.mockResolvedValue(1);

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
    mockCount.mockResolvedValue(0);

    const result = await getPageForEditor("p1");
    expect(result).toMatchObject({ kind: "invalid", page: { ...row, status: "draft" } });
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
    mockCount.mockResolvedValue(0);
    const result = await getPageForEditor("p1");
    expect(result).toMatchObject({ kind: "invalid", issues: [{ path: "(root)" }] });
  });
});
