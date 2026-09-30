import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { samplePageContent } from "@/features/sections/sample-page";

import type * as Queries from "./queries";

const mockFindUnique = jest.fn<(args: unknown) => Promise<unknown>>();

jest.mock("next/server", () => ({ connection: async () => {} }));
jest.mock("@/lib/db", () => ({
  db: { page: { findUnique: (args: unknown) => mockFindUnique(args) } },
}));

// Loaded after the mocks above are registered; next/jest's SWC transform does
// not hoist `jest.mock` from @jest/globals.
let getPublishedPage: typeof Queries.getPublishedPage;

beforeAll(async () => {
  ({ getPublishedPage } = await import("./queries"));
});

beforeEach(() => {
  mockFindUnique.mockReset();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

describe("getPublishedPage (public route query)", () => {
  it("reads only the slug and the published snapshot, never the draft", async () => {
    mockFindUnique.mockResolvedValue({ slug: "sample", publishedContent: samplePageContent });
    await getPublishedPage("sample");

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { slug: "sample" },
      select: { slug: true, publishedContent: true },
    });
  });

  it("returns the published content", async () => {
    mockFindUnique.mockResolvedValue({ slug: "sample-1", publishedContent: samplePageContent });
    expect(await getPublishedPage("sample-1")).toEqual({
      slug: "sample-1",
      content: samplePageContent,
    });
  });

  it("returns null for pages that were never published, even if they have a draft", async () => {
    // The query does not select the draft, so it cannot leak into the result.
    mockFindUnique.mockResolvedValue({ slug: "draft-only", publishedContent: null });
    expect(await getPublishedPage("draft-only")).toBeNull();
  });

  it("returns null for unknown slugs", async () => {
    mockFindUnique.mockResolvedValue(null);
    expect(await getPublishedPage("nope")).toBeNull();
  });

  it("returns null when the published snapshot is invalid", async () => {
    const invalid = structuredClone(samplePageContent);
    invalid.meta.title = "";
    mockFindUnique.mockResolvedValue({ slug: "bad", publishedContent: invalid });
    expect(await getPublishedPage("bad")).toBeNull();
  });
});
