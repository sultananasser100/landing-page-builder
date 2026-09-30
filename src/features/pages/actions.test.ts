import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { RedirectError } from "@/features/auth/test-utils";
import { samplePageContent } from "@/features/sections/sample-page";

import type * as Actions from "./actions";
import { initialCreatePageState, SLUG_TAKEN } from "./create-page-input";

const calls: string[] = [];
const mockRequireAdmin = jest.fn<() => Promise<unknown>>();
const mockSaveDraft = jest.fn<(args: unknown) => Promise<unknown>>();
const mockPublish = jest.fn<(args: unknown) => Promise<unknown>>();
const mockCreatePage = jest.fn<(args: unknown) => Promise<unknown>>();

jest.mock("@/features/auth/session", () => ({
  requireAdmin: () => {
    calls.push("requireAdmin");
    return mockRequireAdmin();
  },
}));
jest.mock("next/navigation", () => ({
  redirect: (url: string) => {
    calls.push("redirect");
    throw new RedirectError(url);
  },
}));
jest.mock("./create-page", () => ({
  createPage: (args: unknown) => {
    calls.push("createPage");
    return mockCreatePage(args);
  },
}));
jest.mock("./mutations", () => ({
  saveDraft: (args: unknown) => {
    calls.push("saveDraft");
    return mockSaveDraft(args);
  },
  publishSavedDraft: (args: unknown) => {
    calls.push("publishSavedDraft");
    return mockPublish(args);
  },
}));

// Loaded after the mocks above are registered; next/jest's SWC transform does
// not hoist `jest.mock` from @jest/globals.
let savePageDraft: typeof Actions.savePageDraft;
let publishPage: typeof Actions.publishPage;
let createPageFromTemplate: typeof Actions.createPageFromTemplate;

beforeAll(async () => {
  ({ savePageDraft, publishPage, createPageFromTemplate } = await import("./actions"));
});

const VERSION = "2026-09-29T10:00:00.000Z";
const saveInput = { pageId: "p1", expectedVersion: VERSION, content: samplePageContent };
const publishInput = { pageId: "p1", expectedVersion: VERSION };
const success = { ok: true, version: VERSION, status: "draft", publishedAt: null };

beforeEach(() => {
  calls.length = 0;
  for (const mock of [mockRequireAdmin, mockSaveDraft, mockPublish, mockCreatePage]) {
    mock.mockReset();
  }
  mockRequireAdmin.mockResolvedValue({ subject: "admin" });
  mockSaveDraft.mockResolvedValue(success);
  mockPublish.mockResolvedValue(success);
});

describe.each([
  ["savePageDraft", () => savePageDraft(saveInput), "saveDraft", mockSaveDraft],
  ["publishPage", () => publishPage(publishInput), "publishSavedDraft", mockPublish],
] as const)("%s authorization", (_name, call, mutation, mutationMock) => {
  it("checks the admin session before any mutation", async () => {
    await call();
    expect(calls).toEqual(["requireAdmin", mutation]);
  });

  it("does not mutate when the visitor is not signed in", async () => {
    mockRequireAdmin.mockRejectedValue(new RedirectError("/login"));
    await expect(call()).rejects.toMatchObject({ url: "/login" });
    expect(mutationMock).not.toHaveBeenCalled();
  });
});

describe("savePageDraft", () => {
  it("passes the page, the parsed version and the content to the mutation", async () => {
    expect(await savePageDraft(saveInput)).toEqual(success);
    expect(mockSaveDraft).toHaveBeenCalledWith({
      pageId: "p1",
      expectedVersion: new Date(VERSION),
      content: samplePageContent,
    });
  });

  it.each([
    ["a missing page id", { ...saveInput, pageId: "" }],
    ["a non-string page id", { ...saveInput, pageId: 42 }],
    ["an oversized page id", { ...saveInput, pageId: "x".repeat(129) }],
    ["a missing version", { pageId: "p1", content: samplePageContent }],
    ["a malformed version", { ...saveInput, expectedVersion: "yesterday" }],
    ["a non-string version", { ...saveInput, expectedVersion: 12345 }],
  ])("rejects %s without mutating", async (_label, input) => {
    expect(await savePageDraft(input as never)).toEqual({ ok: false, reason: "bad_request" });
    expect(mockSaveDraft).not.toHaveBeenCalled();
  });

  it("leaves content validation to the mutation, which is server-side", async () => {
    mockSaveDraft.mockResolvedValue({ ok: false, reason: "invalid", issues: [] });
    expect(await savePageDraft({ ...saveInput, content: { junk: true } })).toMatchObject({
      reason: "invalid",
    });
    expect(mockSaveDraft).toHaveBeenCalledWith(
      expect.objectContaining({ content: { junk: true } }),
    );
  });

  it("logs unexpected failures and returns a generic error", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockSaveDraft.mockRejectedValue(new Error("connection lost: secret-detail"));

    expect(await savePageDraft(saveInput)).toEqual({ ok: false, reason: "error" });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe("publishPage", () => {
  it("publishes by page and version only; there is no content input", async () => {
    expect(await publishPage(publishInput)).toEqual(success);
    expect(mockPublish).toHaveBeenCalledWith({ pageId: "p1", expectedVersion: new Date(VERSION) });
  });

  it("ignores any content a client tries to send along", async () => {
    await publishPage({ ...publishInput, content: { injected: true } } as never);
    expect(mockPublish).toHaveBeenCalledWith({ pageId: "p1", expectedVersion: new Date(VERSION) });
  });

  it.each([
    ["a missing page id", { expectedVersion: VERSION }],
    ["a malformed version", { pageId: "p1", expectedVersion: "not-a-date" }],
  ])("rejects %s without mutating", async (_label, input) => {
    expect(await publishPage(input as never)).toEqual({ ok: false, reason: "bad_request" });
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it("logs unexpected failures and returns a generic error", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockPublish.mockRejectedValue(new Error("boom"));

    expect(await publishPage(publishInput)).toEqual({ ok: false, reason: "error" });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe("createPageFromTemplate", () => {
  function form(fields: Record<string, string>) {
    const data = new FormData();
    for (const [key, value] of Object.entries(fields)) data.set(key, value);
    return data;
  }
  const valid = { name: "Summer Sale", slug: "summer-sale", templateId: "saas" };

  it("checks the admin session before creating anything, then redirects", async () => {
    mockCreatePage.mockResolvedValue({ ok: true, id: "new-id" });
    await expect(
      createPageFromTemplate(initialCreatePageState, form(valid)),
    ).rejects.toMatchObject({ url: "/dashboard/pages/new-id" });
    expect(calls).toEqual(["requireAdmin", "createPage", "redirect"]);
  });

  it("does not create when the visitor is not signed in", async () => {
    mockRequireAdmin.mockRejectedValue(new RedirectError("/login"));
    await expect(
      createPageFromTemplate(initialCreatePageState, form(valid)),
    ).rejects.toMatchObject({ url: "/login" });
    expect(mockCreatePage).not.toHaveBeenCalled();
  });

  it("creates the page from the trimmed, validated input", async () => {
    mockCreatePage.mockResolvedValue({ ok: true, id: "new-id" });
    await expect(
      createPageFromTemplate(initialCreatePageState, form({ ...valid, name: "  Summer Sale " })),
    ).rejects.toMatchObject({ url: "/dashboard/pages/new-id" });
    expect(mockCreatePage).toHaveBeenCalledWith(valid);
  });

  it("returns a field-level error for a taken slug, without redirecting", async () => {
    mockCreatePage.mockResolvedValue({ ok: false, reason: "slug_taken" });
    expect(await createPageFromTemplate(initialCreatePageState, form(valid))).toEqual({
      errors: { slug: SLUG_TAKEN },
    });
    expect(calls).not.toContain("redirect");
  });

  it("returns field errors for invalid input without creating", async () => {
    const state = await createPageFromTemplate(
      initialCreatePageState,
      form({ name: " ", slug: "Bad Slug", templateId: "agency" }),
    );
    expect(Object.keys(state.errors).sort()).toEqual(["name", "slug", "templateId"]);
    expect(mockCreatePage).not.toHaveBeenCalled();
  });

  it("treats missing fields as invalid", async () => {
    const state = await createPageFromTemplate(initialCreatePageState, form({}));
    expect(Object.keys(state.errors).sort()).toEqual(["name", "slug", "templateId"]);
  });

  it("logs unexpected failures and returns a generic form error without leaking details", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockCreatePage.mockRejectedValue(new Error("connection lost: secret-detail"));

    const state = await createPageFromTemplate(initialCreatePageState, form(valid));
    expect(state.errors.form).toBeDefined();
    expect(JSON.stringify(state)).not.toContain("secret-detail");
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
