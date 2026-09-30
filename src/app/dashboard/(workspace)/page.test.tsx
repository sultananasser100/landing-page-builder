import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";

import { RedirectError } from "@/features/auth/test-utils";
import type { DashboardPage } from "@/features/pages/admin-queries";

import type * as PageModule from "./page";

const calls: string[] = [];
const mockRequireAdmin = jest.fn<() => Promise<unknown>>();
const mockListDashboardPages = jest.fn<() => Promise<DashboardPage[]>>();

jest.mock("@/features/auth/session", () => ({
  requireAdmin: () => {
    calls.push("requireAdmin");
    return mockRequireAdmin();
  },
}));
jest.mock("@/features/pages/admin-queries", () => ({
  listDashboardPages: () => {
    calls.push("listDashboardPages");
    return mockListDashboardPages();
  },
}));

// Loaded after the mocks above are registered; next/jest's SWC transform does
// not hoist `jest.mock` from @jest/globals.
let DashboardPage: typeof PageModule.default;
let metadata: typeof PageModule.metadata;

beforeAll(async () => {
  ({ default: DashboardPage, metadata } = await import("./page"));
});

beforeEach(() => {
  calls.length = 0;
  mockRequireAdmin.mockReset();
  mockRequireAdmin.mockResolvedValue({ subject: "admin" });
  mockListDashboardPages.mockReset();
});

describe("dashboard page", () => {
  it("is titled Pages", () => {
    expect(metadata.title).toBe("Pages");
  });

  it("checks the admin session before loading pages", async () => {
    mockListDashboardPages.mockResolvedValue([]);
    await DashboardPage();
    expect(calls).toEqual(["requireAdmin", "listDashboardPages"]);
  });

  it("does not load pages when the visitor is not signed in", async () => {
    mockRequireAdmin.mockRejectedValue(new RedirectError("/login"));
    await expect(DashboardPage()).rejects.toMatchObject({ url: "/login" });
    expect(mockListDashboardPages).not.toHaveBeenCalled();
  });

  it("renders the Pages heading and the list", async () => {
    mockListDashboardPages.mockResolvedValue([
      {
        id: "p1",
        name: "Sample SaaS page",
        slug: "sample",
        status: "published",
        publishedAt: new Date("2026-09-27T08:00:00Z"),
        updatedAt: new Date("2026-09-29T10:05:00Z"),
      },
    ]);
    const html = renderToStaticMarkup(await DashboardPage());

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>Pages<\/h1>/);
    expect(html).toContain("Sample SaaS page");
  });

  it("links to the New page screen", async () => {
    mockListDashboardPages.mockResolvedValue([]);
    const html = renderToStaticMarkup(await DashboardPage());
    expect(html).toMatch(/<a [^>]*href="\/dashboard\/pages\/new"[^>]*>New page<\/a>/);
  });

  it("renders the empty state when there are no pages", async () => {
    mockListDashboardPages.mockResolvedValue([]);
    const html = renderToStaticMarkup(await DashboardPage());
    expect(html).toContain("No pages yet");
  });
});
