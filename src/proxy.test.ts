import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { NextRequest } from "next/server";

import type * as ConfigModule from "@/features/auth/config";
import { signSessionToken } from "@/features/auth/session-token";
import { TEST_SECRET, testAuthConfig } from "@/features/auth/test-utils";

import type * as ProxyModule from "./proxy";

jest.mock("@/features/auth/config", () => {
  const actual = jest.requireActual<typeof import("@/features/auth/config")>(
    "@/features/auth/config",
  );
  return { ...actual, getAuthConfig: jest.fn() };
});

// Modules under test are loaded after the mock above is registered;
// next/jest's SWC transform does not hoist `jest.mock` from @jest/globals.
let proxy: typeof ProxyModule.proxy;
let config: typeof ProxyModule.config;
let AuthConfigError: typeof ConfigModule.AuthConfigError;
let mockGetAuthConfig: jest.MockedFunction<typeof ConfigModule.getAuthConfig>;

beforeAll(async () => {
  ({ proxy, config } = await import("./proxy"));
  const authConfig = await import("@/features/auth/config");
  AuthConfigError = authConfig.AuthConfigError;
  mockGetAuthConfig = jest.mocked(authConfig.getAuthConfig);
});

beforeEach(() => {
  mockGetAuthConfig.mockReset();
  mockGetAuthConfig.mockReturnValue(testAuthConfig("unused"));
});

afterEach(() => {
  jest.restoreAllMocks();
});

function request(path: string, session?: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: session ? { cookie: `lpb_session=${session}` } : {},
  });
}

function isPassThrough(response: Response) {
  return response.headers.get("x-middleware-next") === "1";
}

describe("proxy", () => {
  it("only runs on /dashboard routes", () => {
    expect(config.matcher).toEqual(["/dashboard/:path*"]);
  });

  it("redirects to /login with the requested path when there is no session", async () => {
    const response = await proxy(request("/dashboard/pages?tab=2"));
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/dashboard/pages?tab=2");
  });

  it("redirects when the session cookie is invalid", async () => {
    const response = await proxy(request("/dashboard", "garbage"));
    expect(response.status).toBe(307);
  });

  it("redirects when the token was signed with another secret", async () => {
    const otherSecret = new TextEncoder().encode("another-secret-value-".repeat(2));
    const response = await proxy(request("/dashboard", await signSessionToken(otherSecret)));
    expect(response.status).toBe(307);
  });

  it("lets a valid session through", async () => {
    const response = await proxy(request("/dashboard", await signSessionToken(TEST_SECRET)));
    expect(isPassThrough(response)).toBe(true);
  });

  it("redirects and logs when auth is misconfigured", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockGetAuthConfig.mockImplementation(() => {
      throw new AuthConfigError("Invalid auth configuration: SESSION_SECRET is not set");
    });

    const response = await proxy(request("/dashboard", await signSessionToken(TEST_SECRET)));
    expect(response.status).toBe(307);
    expect(consoleError).toHaveBeenCalled();
  });
});
