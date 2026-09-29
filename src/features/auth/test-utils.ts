// Shared fakes for auth tests that mock `next/headers` and `next/navigation`.

import type { AuthConfig } from "./config";

export class RedirectError extends Error {
  constructor(readonly url: string) {
    super(`NEXT_REDIRECT ${url}`);
  }
}

export type FakeCookie = { value: string; options?: Record<string, unknown> };

/** Minimal stand-in for the store returned by `cookies()`. */
export function createCookieStore() {
  const jar = new Map<string, FakeCookie>();
  return {
    jar,
    get(name: string) {
      const cookie = jar.get(name);
      return cookie ? { name, value: cookie.value } : undefined;
    },
    set(name: string, value: string, options?: Record<string, unknown>) {
      jar.set(name, { value, options });
    },
    delete(nameOrOptions: string | { name: string }) {
      jar.delete(typeof nameOrOptions === "string" ? nameOrOptions : nameOrOptions.name);
    },
  };
}

export const TEST_SECRET = new TextEncoder().encode("test-session-secret-".repeat(2));

export function testAuthConfig(passwordHash: string): AuthConfig {
  return {
    adminEmail: "admin@example.com",
    passwordHash,
    sessionSecret: TEST_SECRET,
  };
}
