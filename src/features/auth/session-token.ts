import { jwtVerify, SignJWT } from "jose";

// Kept free of `server-only` and `next/headers` so Proxy can import it.

export const SESSION_COOKIE_NAME = "lpb_session";
export const SESSION_SUBJECT = "admin";
/** Absolute session lifetime: 7 days, no sliding refresh. */
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

const ALGORITHM = "HS256";

export type Session = {
  subject: typeof SESSION_SUBJECT;
  expiresAt: Date;
};

/** Signs a session token containing only `sub`, `iat` and `exp`. */
export async function signSessionToken(
  secret: Uint8Array,
  now: Date = new Date(),
): Promise<string> {
  const issuedAt = Math.floor(now.getTime() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: ALGORITHM, typ: "JWT" })
    .setSubject(SESSION_SUBJECT)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + SESSION_DURATION_SECONDS)
    .sign(secret);
}

/**
 * Returns the session for a valid, unexpired HS256 token signed with `secret`,
 * or null for anything else. Never throws.
 */
export async function verifySessionToken(
  token: string | undefined,
  secret: Uint8Array,
  now?: Date,
): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [ALGORITHM],
      subject: SESSION_SUBJECT,
      requiredClaims: ["iat", "exp"],
      currentDate: now,
    });
    return {
      subject: SESSION_SUBJECT,
      expiresAt: new Date((payload.exp as number) * 1000),
    };
  } catch {
    return null;
  }
}
