import { NextResponse, type NextRequest } from "next/server";

import { getAuthConfig, logAuthConfigError } from "@/features/auth/config";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/features/auth/session-token";

/**
 * Optimistic check: redirects requests without a valid session cookie to
 * /login before protected pages render. Pages and Server Actions still call
 * `requireAdmin()`, which is the authoritative check.
 */
export async function proxy(request: NextRequest) {
  if (await hasValidSession(request)) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(loginUrl);
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;

  try {
    const { sessionSecret } = getAuthConfig();
    return (await verifySessionToken(token, sessionSecret)) !== null;
  } catch (error) {
    logAuthConfigError(error);
    return false;
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
