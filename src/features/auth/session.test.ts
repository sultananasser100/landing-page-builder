import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";

import type * as ConfigModule from "./config";
import type * as SessionModule from "./session";
import { signSessionToken } from "./session-token";
import {
  createCookieStore,
  RedirectError,
  TEST_SECRET,
  testAuthConfig,
} from "./test-utils";

const mockCookieStore = createCookieStore();

jest.mock("next/headers", () => ({
  cookies: async () => mockCookieStore,
}));
jest.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new RedirectError(url);
  },
}));
jest.mock("./config", () => {
  const actual = jest.requireActual<typeof import("./config")>("./config");
  return { ...actual, getAuthConfig: jest.fn() };
});

// Modules under test are loaded after the mocks above are registered;
// next/jest's SWC transform does not hoist `jest.mock` from @jest/globals.
let getSession: typeof SessionModule.getSession;
let requireAdmin: typeof SessionModule.requireAdmin;
let AuthConfigError: typeof ConfigModule.AuthConfigError;
let mockGetAuthConfig: jest.MockedFunction<typeof ConfigModule.getAuthConfig>;

beforeAll(async () => {
  ({ getSession, requireAdmin } = await import("./session"));
  const config = await import("./config");
  AuthConfigError = config.AuthConfigError;
  mockGetAuthConfig = jest.mocked(config.getAuthConfig);
});

beforeEach(() => {
  mockCookieStore.jar.clear();
  mockGetAuthConfig.mockReset();
  mockGetAuthConfig.mockReturnValue(testAuthConfig("unused"));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("getSession", () => {
  it("returns null without a cookie", async () => {
    expect(await getSession()).toBeNull();
  });

  it("returns the session for a valid cookie", async () => {
    mockCookieStore.set("lpb_session", await signSessionToken(TEST_SECRET));
    expect(await getSession()).toMatchObject({ subject: "admin" });
  });

  it("returns null for an invalid cookie", async () => {
    mockCookieStore.set("lpb_session", "garbage");
    expect(await getSession()).toBeNull();
  });

  it("returns null for a token signed with another secret", async () => {
    const otherSecret = new TextEncoder().encode("another-secret-value-".repeat(2));
    mockCookieStore.set("lpb_session", await signSessionToken(otherSecret));
    expect(await getSession()).toBeNull();
  });

  it("returns null and logs when auth is misconfigured", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockCookieStore.set("lpb_session", await signSessionToken(TEST_SECRET));
    mockGetAuthConfig.mockImplementation(() => {
      throw new AuthConfigError("Invalid auth configuration: SESSION_SECRET is not set");
    });

    expect(await getSession()).toBeNull();
    expect(consoleError).toHaveBeenCalledWith(
      "[auth] Invalid auth configuration: SESSION_SECRET is not set",
    );
  });
});

describe("requireAdmin", () => {
  it("redirects to /login without a valid session", async () => {
    await expect(requireAdmin()).rejects.toMatchObject({ url: "/login" });
  });

  it("returns the session when signed in", async () => {
    mockCookieStore.set("lpb_session", await signSessionToken(TEST_SECRET));
    await expect(requireAdmin()).resolves.toMatchObject({ subject: "admin" });
  });
});
