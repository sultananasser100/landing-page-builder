import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { draftPageContentSchema } from "@/features/sections/page-content";
import { Prisma } from "@/generated/prisma/client";

import type * as CreatePage from "./create-page";

const mockCreate = jest.fn<(args: unknown) => Promise<unknown>>();

jest.mock("@/lib/db", () => ({
  db: { page: { create: (args: unknown) => mockCreate(args) } },
}));

// Loaded after the mock above is registered; next/jest's SWC transform does
// not hoist `jest.mock` from @jest/globals.
let createPage: typeof CreatePage.createPage;

beforeAll(async () => {
  ({ createPage } = await import("./create-page"));
});

beforeEach(() => {
  mockCreate.mockReset();
});

function uniqueViolation() {
  return new Prisma.PrismaClientKnownRequestError("unique", {
    code: "P2002",
    clientVersion: "test",
  });
}

type CreateArgs = { data: Record<string, unknown> };

describe("createPage", () => {
  it("stores the name, slug and template draft, and nothing published", async () => {
    mockCreate.mockResolvedValue({ id: "new-id" });

    const result = await createPage({ name: "Summer", slug: "summer", templateId: "saas" });

    expect(result).toEqual({ ok: true, id: "new-id" });
    const { data } = mockCreate.mock.calls[0]![0] as CreateArgs;
    expect(Object.keys(data).sort()).toEqual(["draftContent", "name", "slug"]);
    expect(data.name).toBe("Summer");
    expect(data.slug).toBe("summer");
    expect(draftPageContentSchema.parse(data.draftContent).sections).toHaveLength(7);
  });

  it("stores empty content for the Blank template", async () => {
    mockCreate.mockResolvedValue({ id: "new-id" });
    await createPage({ name: "Empty", slug: "empty", templateId: "blank" });

    const { data } = mockCreate.mock.calls[0]![0] as CreateArgs;
    expect(draftPageContentSchema.parse(data.draftContent).sections).toEqual([]);
  });

  it("reports a taken slug instead of throwing", async () => {
    mockCreate.mockRejectedValue(uniqueViolation());
    expect(await createPage({ name: "A", slug: "taken", templateId: "blank" })).toEqual({
      ok: false,
      reason: "slug_taken",
    });
  });

  it("rethrows other database errors", async () => {
    mockCreate.mockRejectedValue(new Error("connection lost"));
    await expect(createPage({ name: "A", slug: "a", templateId: "blank" })).rejects.toThrow(
      "connection lost",
    );
  });
});
