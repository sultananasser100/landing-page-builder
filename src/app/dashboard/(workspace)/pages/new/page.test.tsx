import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";

import { RedirectError } from "@/features/auth/test-utils";

import type * as PageModule from "./page";

const mockRequireAdmin = jest.fn<() => Promise<unknown>>();

jest.mock("@/features/auth/session", () => ({ requireAdmin: () => mockRequireAdmin() }));
jest.mock("@/features/pages/actions", () => ({ createPageFromTemplate: jest.fn() }));

// Loaded after the mocks above are registered; next/jest's SWC transform does
// not hoist `jest.mock` from @jest/globals.
let NewPagePage: typeof PageModule.default;
let metadata: typeof PageModule.metadata;

beforeAll(async () => {
  ({ default: NewPagePage, metadata } = await import("./page"));
});

beforeEach(() => {
  mockRequireAdmin.mockReset();
  mockRequireAdmin.mockResolvedValue({ subject: "admin" });
});

describe("new page route", () => {
  it("is titled New page", () => {
    expect(metadata.title).toBe("New page");
  });

  it("redirects visitors who are not signed in", async () => {
    mockRequireAdmin.mockRejectedValue(new RedirectError("/login"));
    await expect(NewPagePage()).rejects.toMatchObject({ url: "/login" });
  });

  it("renders one heading and the template choices", async () => {
    const html = renderToStaticMarkup(await NewPagePage());
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>New page<\/h1>/);
    expect(html).toContain("SaaS landing page");
  });
});
