/**
 * @module lib/auth
 * Authentication and role-based authorization utilities.
 *
 * Roles are extracted exclusively from the signed JWT session cookie.
 * Header-based role override has been intentionally removed as a security risk.
 */

import type { NextRequest } from "next/server";
import { verifySessionToken, type SessionPayload } from "@/lib/session";

/** All application roles ordered by privilege level. */
export type AppRole = "owner" | "admin" | "investigator" | "billing" | "client";

/**
 * Extract the authenticated user's role from the session cookie.
 * Falls back to "client" (least-privileged) if the token is missing or invalid.
 */
export async function getRoleFromRequest(req: NextRequest): Promise<AppRole> {
  const token = req.cookies.get("session")?.value;
  const session = await verifySessionToken(token);
  return normalizeRole(session?.role);
}

/**
 * Extract the full session payload from a request, or null if unauthenticated.
 */
export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get("session")?.value;
  return verifySessionToken(token);
}

/**
 * Normalize an unknown role string to a valid AppRole.
 * Returns "client" for any unrecognized value.
 */
function normalizeRole(role?: string | null): AppRole {
  const r = role?.toLowerCase();
  if (r === "owner" || r === "admin" || r === "investigator" || r === "billing" || r === "client") {
    return r;
  }
  return "client";
}

/** Whether the role can create/edit time entries. */
export function canWriteTime(role: AppRole): boolean {
  return role === "owner" || role === "admin" || role === "investigator";
}

/** Whether the role can approve or reimburse expenses. */
export function canApproveExpenses(role: AppRole): boolean {
  return role === "owner" || role === "admin" || role === "billing";
}

/** Whether the role can manage contracts (create, send, sign). */
export function canManageContracts(role: AppRole): boolean {
  return role === "owner" || role === "admin" || role === "billing";
}

/** Whether the role can submit expenses (investigators + above). */
export function canSubmitExpenses(role: AppRole): boolean {
  return role === "owner" || role === "admin" || role === "investigator";
}
