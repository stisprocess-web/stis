/**
 * @module lib/server-auth
 * Server-side session access for App Router server components.
 *
 * Uses Next.js `cookies()` to read the session cookie and verify it.
 */

import { cookies } from "next/headers";
import { verifySessionToken, type SessionPayload } from "@/lib/session";
import type { RoleContext } from "@/lib/data";

/**
 * Get the current user session from the server context.
 * Returns null if not authenticated.
 */
export async function getServerSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  return verifySessionToken(token);
}

/**
 * Get a RoleContext from the current session for data queries.
 * Returns undefined if not authenticated (data will be unfiltered).
 */
export async function getRoleContext(): Promise<RoleContext | undefined> {
  const session = await getServerSession();
  if (!session) return undefined;
  return { role: session.role, userId: session.userId };
}
