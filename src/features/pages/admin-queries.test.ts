import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { RedirectError } from "@/features/auth/test-utils";
import { Prisma } from "@/generated/prisma/client";

import type * as AdminQueries from "./admin-queries";

const mockFindMany = jest.fn<(args: unknown) => Promise<unknown[]>>();
const mockRequireAdmin = jest.fn<() => Promise<unknown>>();

jest.mock("@/lib/db", () => ({
  db: { page: { findMany: (args: unknown) => mockFindMany(args) } },
}));
jest.mock("@/features/auth/session", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

// Loaded after the mocks above are registered; next/jest's SWC transform does
// not hoist `jest.mock` from @jest/globals.
let listDashboardPages: typeof AdminQueries.listDashboardPages;
let toDashboardPage: typeof AdminQueries.toDashboardPage;

beforeAll(async () => {
  ({ listDashboardPages, toDashboardPage } = await import("./admin-queries"));
});

const updatedA = new Date("2026-09-29T10:00:00Z");
const updatedB = new Date("2026-09-28T09:00:00Z");
const publishedAt = new Date("2026-09-27T08:00:00Z");

const rowA = { id: "a", name: "Page A", slug: "page-a", publishedAt, updatedAt: updatedA };
const rowB = { id: "b", name: "Page B", slug: "page-b", publishedAt: null, updatedAt: updatedB };

beforeEach(() => {
  mockFindMany.mockReset();
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
