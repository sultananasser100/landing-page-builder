import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";

import type * as RouteModule from "./route";

const mockGetSession = jest.fn<() => Promise<unknown>>();

jest.mock("@/features/auth/session", () => ({ getSession: () => mockGetSession() }));

// Loaded after the mock above is registered; next/jest's SWC transform does
// not hoist `jest.mock` from @jest/globals.
let GET: typeof RouteModule.GET;

beforeAll(async () => {
  ({ GET } = await import("./route"));
});

beforeEach(() => {
  mockGetSession.mockReset();
});

describe("GET /dashboard/session", () => {
  it("answers 204 with no body for a valid session", async () => {
    mockGetSession.mockResolvedValue({ subject: "admin" });
    const response = await GET();
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
  });

  it("answers 401 when there is no valid session", async () => {
    mockGetSession.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
  });

  it("is never cached", async () => {
    mockGetSession.mockResolvedValue(null);
    expect((await GET()).headers.get("Cache-Control")).toBe("no-store");
    mockGetSession.mockResolvedValue({ subject: "admin" });
    expect((await GET()).headers.get("Cache-Control")).toBe("no-store");
  });
});
