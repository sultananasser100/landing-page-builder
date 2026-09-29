import { describe, expect, it } from "@jest/globals";
import { decodeJwt, decodeProtectedHeader, SignJWT, UnsecuredJWT } from "jose";

import {
  SESSION_DURATION_SECONDS,
  signSessionToken,
  verifySessionToken,
} from "./session-token";

const secret = new TextEncoder().encode("s".repeat(32));
const otherSecret = new TextEncoder().encode("o".repeat(32));
const now = new Date("2026-01-01T00:00:00Z");
const nowSeconds = Math.floor(now.getTime() / 1000);

describe("signSessionToken", () => {
  it("contains only sub, iat and exp with a 7-day absolute expiry", async () => {
    const token = await signSessionToken(secret, now);
    expect(decodeJwt(token)).toEqual({
      sub: "admin",
      iat: nowSeconds,
      exp: nowSeconds + SESSION_DURATION_SECONDS,
    });
    expect(SESSION_DURATION_SECONDS).toBe(7 * 24 * 60 * 60);
    expect(decodeProtectedHeader(token)).toEqual({ alg: "HS256", typ: "JWT" });
  });
});

describe("verifySessionToken", () => {
  it("accepts a valid token", async () => {
    const token = await signSessionToken(secret, now);
    const session = await verifySessionToken(token, secret, now);
    expect(session).toEqual({
      subject: "admin",
      expiresAt: new Date((nowSeconds + SESSION_DURATION_SECONDS) * 1000),
    });
  });

  it("accepts a token just before expiry and rejects it after", async () => {
    const token = await signSessionToken(secret, now);
    const justBefore = new Date((nowSeconds + SESSION_DURATION_SECONDS - 1) * 1000);
    const after = new Date((nowSeconds + SESSION_DURATION_SECONDS + 1) * 1000);
    expect(await verifySessionToken(token, secret, justBefore)).not.toBeNull();
    expect(await verifySessionToken(token, secret, after)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signSessionToken(otherSecret, now);
    expect(await verifySessionToken(token, secret, now)).toBeNull();
  });

  it("rejects a tampered payload", async () => {
    const token = await signSessionToken(secret, now);
    const [header, , signature] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ sub: "admin", iat: nowSeconds, exp: nowSeconds + 10 ** 9 }),
    ).toString("base64url");
    expect(
      await verifySessionToken(`${header}.${forgedPayload}.${signature}`, secret, now),
    ).toBeNull();
  });

  it("rejects a tampered signature", async () => {
    const token = await signSessionToken(secret, now);
    const tampered = token.slice(0, -2) + (token.endsWith("AA") ? "BB" : "AA");
    expect(await verifySessionToken(tampered, secret, now)).toBeNull();
  });

  it("rejects unsigned (alg: none) tokens", async () => {
    const token = new UnsecuredJWT({})
      .setSubject("admin")
      .setIssuedAt(nowSeconds)
      .setExpirationTime(nowSeconds + 60)
      .encode();
    expect(await verifySessionToken(token, secret, now)).toBeNull();
  });

  it("rejects other algorithms even with the right secret", async () => {
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS512" })
      .setSubject("admin")
      .setIssuedAt(nowSeconds)
      .setExpirationTime(nowSeconds + 60)
      .sign(new TextEncoder().encode("s".repeat(64)));
    expect(
      await verifySessionToken(token, new TextEncoder().encode("s".repeat(64)), now),
    ).toBeNull();
  });

  it("rejects a token with the wrong subject", async () => {
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("someone-else")
      .setIssuedAt(nowSeconds)
      .setExpirationTime(nowSeconds + 60)
      .sign(secret);
    expect(await verifySessionToken(token, secret, now)).toBeNull();
  });

  it("rejects a token without an expiry", async () => {
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("admin")
      .setIssuedAt(nowSeconds)
      .sign(secret);
    expect(await verifySessionToken(token, secret, now)).toBeNull();
  });

  it.each([undefined, "", "not-a-jwt", "a.b.c", "....."])(
    "returns null for malformed token %p",
    async (token) => {
      expect(await verifySessionToken(token, secret, now)).toBeNull();
    },
  );
});
