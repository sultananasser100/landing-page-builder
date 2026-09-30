import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { samplePageContent } from "@/features/sections/sample-page";
import { Prisma } from "@/generated/prisma/client";

import type * as Mutations from "./mutations";

const mockUpdate = jest.fn<(args: unknown) => Promise<unknown>>();
const mockFindUnique = jest.fn<(args: unknown) => Promise<unknown>>();
const mockCount = jest.fn<(args: unknown) => Promise<number>>();
const mockFindMany = jest.fn<(args: unknown) => Promise<unknown[]>>();

jest.mock("@/lib/db", () => ({
  db: {
    page: {
      update: (args: unknown) => mockUpdate(args),
      findUnique: (args: unknown) => mockFindUnique(args),
      count: (args: unknown) => mockCount(args),
      findMany: (args: unknown) => mockFindMany(args),
      fields: { draftContent: { $field: "draftContent" } },
    },
  },
}));

// Loaded after the mock above is registered; next/jest's SWC transform does
// not hoist `jest.mock` from @jest/globals.
let saveDraft: typeof Mutations.saveDraft;
let publishSavedDraft: typeof Mutations.publishSavedDraft;

beforeAll(async () => {
  ({ saveDraft, publishSavedDraft } = await import("./mutations"));
});

const version = new Date("2026-09-29T10:00:00.000Z");
const newVersion = new Date("2026-09-29T10:05:00.000Z");
const publishedAt = new Date("2026-09-29T10:06:00.000Z");

/** Prisma's "record to update not found" error, as thrown by a failed conditional update. */
function notFoundError() {
  return new Prisma.PrismaClientKnownRequestError("not found", {
    code: "P2025",
    clientVersion: "test",
  });
}

function mockStatuses(published: string[], inSync: string[]) {
  mockFindMany.mockImplementation(async (args) => {
    const where = (args as { where: { publishedContent: { equals?: unknown } } }).where;
    return (where.publishedContent.equals ? inSync : published).map((id) => ({ id }));
  });
}

function withContent(mutate: (content: typeof samplePageContent) => void) {
  const content = structuredClone(samplePageContent);
  mutate(content);
  return content;
}

beforeEach(() => {
  for (const mock of [mockUpdate, mockFindUnique, mockCount, mockFindMany]) mock.mockReset();
  mockStatuses([], []);
});

describe("saveDraft", () => {
  it("stores valid content as the draft only, guarded by the expected version", async () => {
    mockUpdate.mockResolvedValue({ updatedAt: newVersion, publishedAt: null });

    const result = await saveDraft({
      pageId: "p1",
      content: samplePageContent,
      expectedVersion: version,
    });

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "p1", updatedAt: version },
      data: { draftContent: samplePageContent },
      select: { updatedAt: true, publishedAt: true },
    });
    expect(result).toEqual({
      ok: true,
      version: newVersion.toISOString(),
      status: "draft",
      publishedAt: null,
    });
  });

  it("never writes the published snapshot or publishedAt", async () => {
    mockUpdate.mockResolvedValue({ updatedAt: newVersion, publishedAt });
    mockStatuses(["p1"], []);
    await saveDraft({ pageId: "p1", content: samplePageContent, expectedVersion: version });

    const { data } = mockUpdate.mock.calls[0]![0] as { data: Record<string, unknown> };
    expect(Object.keys(data)).toEqual(["draftContent"]);
  });

  it("reports unpublished changes for a published page whose draft now differs", async () => {
    mockUpdate.mockResolvedValue({ updatedAt: newVersion, publishedAt });
    mockStatuses(["p1"], []); // published, but the draft no longer matches

    expect(
      await saveDraft({ pageId: "p1", content: samplePageContent, expectedVersion: version }),
    ).toEqual({
      ok: true,
      version: newVersion.toISOString(),
      status: "unpublished-changes",
      publishedAt: publishedAt.toISOString(),
    });
  });

  it("accepts drafts with empty editable strings", async () => {
    mockUpdate.mockResolvedValue({ updatedAt: newVersion, publishedAt: null });
    const draft = withContent((c) => {
      c.meta.title = "";
      c.sections = [];
    });
    expect(await saveDraft({ pageId: "p1", content: draft, expectedVersion: version })).toMatchObject({
      ok: true,
    });
  });

  it.each([
    ["an unsafe href", withContent((c) => {
      const hero = c.sections[0]!;
      if (hero.type === "hero") hero.data.primaryButton.href = "javascript:alert(1)";
    })],
    ["a wrong schema version", { ...samplePageContent, schemaVersion: 2 }],
    ["an unknown key", { ...samplePageContent, extra: true }],
    ["too many sections", withContent((c) => {
      c.sections = Array.from({ length: 21 }, (_, i) => ({ ...c.sections[5]!, id: `cta-${i}` }));
    })],
    ["non-object content", "not content"],
    ["missing content", undefined],
  ])("rejects %s without touching the database", async (_label, content) => {
    const result = await saveDraft({ pageId: "p1", content, expectedVersion: version });

    expect(result).toMatchObject({ ok: false, reason: "invalid" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns only generic issues, never the submitted values", async () => {
    const content = withContent((c) => {
      const hero = c.sections[0]!;
      if (hero.type === "hero") hero.data.primaryButton.href = "javascript:submitted-secret";
    });
    const result = await saveDraft({ pageId: "p1", content, expectedVersion: version });

    if (result.ok || result.reason !== "invalid") throw new Error("expected invalid");
    expect(JSON.stringify(result.issues)).not.toContain("submitted-secret");
    expect(result.issues).toContainEqual({
      path: "sections.0.data.primaryButton.href",
      message: "Invalid value",
    });
  });

  it("reports a conflict when the page changed since it was loaded", async () => {
    mockUpdate.mockRejectedValue(notFoundError());
    mockCount.mockResolvedValue(1);
    expect(
      await saveDraft({ pageId: "p1", content: samplePageContent, expectedVersion: version }),
    ).toEqual({ ok: false, reason: "conflict" });
  });

  it("reports not_found when the page no longer exists", async () => {
    mockUpdate.mockRejectedValue(notFoundError());
    mockCount.mockResolvedValue(0);
    expect(
      await saveDraft({ pageId: "gone", content: samplePageContent, expectedVersion: version }),
    ).toEqual({ ok: false, reason: "not_found" });
  });

  it("rethrows unexpected database errors", async () => {
    mockUpdate.mockRejectedValue(new Error("connection lost"));
    await expect(
      saveDraft({ pageId: "p1", content: samplePageContent, expectedVersion: version }),
    ).rejects.toThrow("connection lost");
  });
});

describe("publishSavedDraft", () => {
  it("publishes the saved draft, sets publishedAt, and guards on the version it read", async () => {
    mockFindUnique.mockResolvedValue({ draftContent: samplePageContent, updatedAt: version });
    mockUpdate.mockResolvedValue({ updatedAt: newVersion, publishedAt });
    mockStatuses(["p1"], ["p1"]);

    const before = Date.now();
    const result = await publishSavedDraft({ pageId: "p1", expectedVersion: version });

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: "p1" },
      select: { draftContent: true, updatedAt: true },
    });
    const args = mockUpdate.mock.calls[0]![0] as {
      where: unknown;
      data: { publishedContent: unknown; publishedAt: Date; draftContent?: unknown };
    };
    expect(args.where).toEqual({ id: "p1", updatedAt: version });
    expect(args.data.publishedContent).toEqual(samplePageContent);
    expect(args.data.publishedAt.getTime()).toBeGreaterThanOrEqual(before);
    // The draft is preserved: it is not part of the update.
    expect(args.data).not.toHaveProperty("draftContent");
    expect(result).toEqual({
      ok: true,
      version: newVersion.toISOString(),
      status: "published",
      publishedAt: publishedAt.toISOString(),
    });
  });

  it("publishes only what is saved in the database, never client content", async () => {
    // The action passes no content at all; the function's input has none.
    expect(publishSavedDraft.length).toBe(1);
    mockFindUnique.mockResolvedValue({ draftContent: samplePageContent, updatedAt: version });
    mockUpdate.mockResolvedValue({ updatedAt: newVersion, publishedAt });
    await publishSavedDraft({ pageId: "p1", expectedVersion: version });
    const args = mockUpdate.mock.calls[0]![0] as { data: { publishedContent: unknown } };
    expect(args.data.publishedContent).toEqual(samplePageContent);
  });

  it.each([
    ["empty required fields", withContent((c) => { c.meta.title = ""; })],
    ["no sections", withContent((c) => { c.sections = []; })],
    ["an empty link", withContent((c) => {
      const hero = c.sections[0]!;
      if (hero.type === "hero") hero.data.primaryButton.href = "";
    })],
    ["an unsafe link", withContent((c) => {
      const hero = c.sections[0]!;
      if (hero.type === "hero") hero.data.primaryButton.href = "javascript:alert(1)";
    })],
  ])("refuses to publish a draft with %s, without writing", async (_label, draft) => {
    mockFindUnique.mockResolvedValue({ draftContent: draft, updatedAt: version });

    const result = await publishSavedDraft({ pageId: "p1", expectedVersion: version });

    expect(result).toMatchObject({ ok: false, reason: "invalid" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("refuses when the page changed since the editor loaded it", async () => {
    mockFindUnique.mockResolvedValue({ draftContent: samplePageContent, updatedAt: newVersion });
    expect(await publishSavedDraft({ pageId: "p1", expectedVersion: version })).toEqual({
      ok: false,
      reason: "conflict",
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("reports a conflict if the draft changes between the read and the update", async () => {
    mockFindUnique.mockResolvedValue({ draftContent: samplePageContent, updatedAt: version });
    mockUpdate.mockRejectedValue(notFoundError());
    mockCount.mockResolvedValue(1);
    expect(await publishSavedDraft({ pageId: "p1", expectedVersion: version })).toEqual({
      ok: false,
      reason: "conflict",
    });
  });

  it("reports not_found for unknown pages", async () => {
    mockFindUnique.mockResolvedValue(null);
    expect(await publishSavedDraft({ pageId: "gone", expectedVersion: version })).toEqual({
      ok: false,
      reason: "not_found",
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
