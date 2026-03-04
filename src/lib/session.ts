/**
 * @module lib/session
 * JWT session token creation and verification using the `jose` library.
 *
 * Tokens are HS256-signed, valid for 30 days, and contain the user's
 * ID, email, and role as claims.
 */

import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-change-me",
);

/** Shape of the JWT payload stored in the session cookie. */
export interface SessionPayload {
  userId: string;
  email: string;
  role: "owner" | "admin" | "investigator" | "billing" | "client";
}

/**
 * Create a signed JWT session token.
 * @param payload - User identity and role claims.
 * @returns Signed JWT string.
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

/**
 * Verify and decode a session token.
 * @param token - Raw JWT string from the session cookie.
 * @returns Decoded session payload, or null if invalid/expired.
 */
export async function verifySessionToken(token?: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
