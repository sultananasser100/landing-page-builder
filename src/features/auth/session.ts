import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { getAuthConfig, logAuthConfigError } from "./config";
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  signSessionToken,
  verifySessionToken,
  type Session,
} from "./session-token";

export async function createSession(): Promise<void> {
  const token = await signSessionToken(getAuthConfig().sessionSecret);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete({ name: SESSION_COOKIE_NAME, path: "/" });
}

/**
 * Returns the current admin session, or null when there is no valid session.
 * A misconfigured auth environment is logged and treated as signed out.
 * Memoized per request.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  let secret: Uint8Array;
  try {
    secret = getAuthConfig().sessionSecret;
  } catch (error) {
    logAuthConfigError(error);
    return null;
  }
  return verifySessionToken(token, secret);
});

/**
 * The authoritative auth check. Call it at the top of every protected page and
 * every Server Action that changes data; it redirects to /login when there is
 * no valid session. Proxy only performs an optimistic pre-check.
 */
export const requireAdmin = cache(async (): Promise<Session> => {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
});
