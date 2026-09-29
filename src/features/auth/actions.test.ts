import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { hash } from "bcryptjs";

import type * as ActionsModule from "./actions";
import type * as ConfigModule from "./config";
import { initialLoginState } from "./schemas";
import { SESSION_DURATION_SECONDS, verifySessionToken } from "./session-token";
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
let login: typeof ActionsModule.login;
let logout: typeof ActionsModule.logout;
let AuthConfigError: typeof ConfigModule.AuthConfigError;
let mockGetAuthConfig: jest.MockedFunction<typeof ConfigModule.getAuthConfig>;

const PASSWORD = "correct-password";
let passwordHash: string;

beforeAll(async () => {
  ({ login, logout } = await import("./actions"));
  const config = await import("./config");
  AuthConfigError = config.AuthConfigError;
  mockGetAuthConfig = jest.mocked(config.getAuthConfig);
  passwordHash = await hash(PASSWORD, 4);
});

beforeEach(() => {
  mockCookieStore.jar.clear();
  mockGetAuthConfig.mockReset();
  mockGetAuthConfig.mockReturnValue(testAuthConfig(passwordHash));
});

afterEach(() => {
  jest.restoreAllMocks();
});

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

async function loginRedirect(fields: Record<string, string>): Promise<string> {
  try {
    await login(initialLoginState, form(fields));
  } catch (error) {
    if (error instanceof RedirectError) return error.url;
    throw error;
  }
  throw new Error("expected login to redirect");
}

describe("login", () => {
  it("creates a session cookie and redirects to /dashboard on success", async () => {
    const url = await loginRedirect({ email: "admin@example.com", password: PASSWORD });
    expect(url).toBe("/dashboard");

    const cookie = mockCookieStore.jar.get("lpb_session");
    expect(cookie).toBeDefined();
    expect(cookie!.options).toEqual({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false, // NODE_ENV is "test"; only production sets Secure
      maxAge: SESSION_DURATION_SECONDS,
    });
    expect(await verifySessionToken(cookie!.value, TEST_SECRET)).toMatchObject({
      subject: "admin",
    });
  });

  it("matches the email case-insensitively", async () => {
    await expect(
      loginRedirect({ email: "  ADMIN@example.com ", password: PASSWORD }),
    ).resolves.toBe("/dashboard");
  });

  it("redirects to a safe next path", async () => {
    await expect(
      loginRedirect({ email: "admin@example.com", password: PASSWORD, next: "/dashboard?tab=2" }),
    ).resolves.toBe("/dashboard?tab=2");
  });

  it.each(["https://evil.example.com", "//evil.example.com", "/\\evil.example.com", "javascript:alert(1)"])(
    "ignores unsafe next %j",
    async (next) => {
      await expect(
        loginRedirect({ email: "admin@example.com", password: PASSWORD, next }),
      ).resolves.toBe("/dashboard");
    },
  );

  it.each([
    ["wrong password", { email: "admin@example.com", password: "wrong" }],
    ["wrong email", { email: "someone@example.com", password: PASSWORD }],
    ["missing password", { email: "admin@example.com" }],
    ["empty password", { email: "admin@example.com", password: "" }],
    ["invalid email", { email: "not-an-email", password: PASSWORD }],
    ["missing fields", {}],
  ])("returns the generic error for %s without a session", async (_label, fields) => {
    const state = await login(initialLoginState, form(fields as Record<string, string>));
    expect(state.error).toBe("Invalid email or password.");
    expect(mockCookieStore.jar.size).toBe(0);
  });

  it("echoes the email but never the password", async () => {
    const state = await login(
      initialLoginState,
      form({ email: "someone@example.com", password: "wrong" }),
    );
    expect(state).toEqual({ error: "Invalid email or password.", email: "someone@example.com" });
    expect(JSON.stringify(state)).not.toContain("wrong");
  });

  it("rejects oversized passwords without checking them", async () => {
    const state = await login(
      initialLoginState,
      form({ email: "admin@example.com", password: "a".repeat(1025) }),
    );
    expect(state.error).toBe("Invalid email or password.");
  });

  it("shows the unavailable message and logs when auth is misconfigured", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockGetAuthConfig.mockImplementation(() => {
      throw new AuthConfigError("Invalid auth configuration: SESSION_SECRET is not set");
    });

    const state = await login(
      initialLoginState,
      form({ email: "admin@example.com", password: PASSWORD }),
    );

    expect(state).toEqual({
      error: "Sign-in is temporarily unavailable.",
      email: "admin@example.com",
    });
    expect(mockCookieStore.jar.size).toBe(0);
    expect(consoleError).toHaveBeenCalledWith(
      "[auth] Invalid auth configuration: SESSION_SECRET is not set",
    );
  });
});

describe("logout", () => {
  it("deletes the session cookie and redirects to /login", async () => {
    mockCookieStore.set("lpb_session", "token");
    await expect(logout()).rejects.toMatchObject({ url: "/login" });
    expect(mockCookieStore.jar.has("lpb_session")).toBe(false);
  });

  it("is safe to call without a session", async () => {
    await expect(logout()).rejects.toMatchObject({ url: "/login" });
  });
});
