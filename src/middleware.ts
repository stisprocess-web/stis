/**
 * @module middleware
 * Edge middleware for authentication and role-based route protection.
 *
 * Runs on matched routes before the request reaches the handler.
 * Redirects unauthenticated users to /login and returns 403 for
 * insufficient role permissions.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";

/** Route prefix → allowed roles mapping (order matters — first match wins). */
const roleRules: ReadonlyArray<{ prefix: string; roles: readonly string[] }> = [
  // ── UI pages ──────────────────────────────────────────────────────
  { prefix: "/reporting", roles: ["owner", "admin", "billing"] },
  { prefix: "/team", roles: ["owner", "admin", "management", "investigator", "billing"] },
  { prefix: "/video", roles: ["owner", "admin", "management", "investigator"] },
  { prefix: "/contracts", roles: ["owner", "admin", "billing"] },
  { prefix: "/invoicing", roles: ["owner", "admin", "billing"] },
  { prefix: "/cases", roles: ["owner", "admin", "management", "investigator", "client"] },
  { prefix: "/evidence", roles: ["owner", "admin", "management", "investigator", "client"] },
  { prefix: "/tasks", roles: ["owner", "admin", "management", "investigator"] },
  { prefix: "/clients", roles: ["owner", "admin", "management", "billing"] },
  { prefix: "/ops", roles: ["owner", "admin", "management"] },
  { prefix: "/settings", roles: ["owner", "admin"] },

  // ── API routes ────────────────────────────────────────────────────
  { prefix: "/api/users", roles: ["owner", "admin"] },
  { prefix: "/api/analytics", roles: ["owner", "admin", "billing"] },
  { prefix: "/api/time-entries", roles: ["owner", "admin", "management", "investigator"] },
  { prefix: "/api/expenses", roles: ["owner", "admin", "management", "investigator", "billing"] },
  { prefix: "/api/cases", roles: ["owner", "admin", "management", "investigator", "client"] },
  { prefix: "/api/evidence", roles: ["owner", "admin", "management", "investigator", "client"] },
  { prefix: "/api/tasks", roles: ["owner", "admin", "management", "investigator"] },
  { prefix: "/api/clients", roles: ["owner", "admin", "management", "billing"] },
  { prefix: "/api/contracts", roles: ["owner", "admin", "billing"] },
  { prefix: "/api/invoices", roles: ["owner", "admin", "billing"] },
  { prefix: "/api/video/ingest", roles: ["owner", "admin", "management", "investigator"] },
  { prefix: "/api/team", roles: ["owner", "admin", "management", "billing"] },
  { prefix: "/api/exports", roles: ["owner", "admin", "billing"] },
  { prefix: "/api/ops", roles: ["owner", "admin", "management"] },
];

/** Find the required roles for a given pathname, or undefined if no restriction. */
function requiredRoles(pathname: string): readonly string[] | undefined {
  return roleRules.find((r) => pathname.startsWith(r.prefix))?.roles;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const allowed = requiredRoles(pathname);

  // No role restriction on this route
  if (!allowed) return NextResponse.next();

  const token = req.cookies.get("session")?.value;
  const session = await verifySessionToken(token);

  // Not authenticated
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Insufficient permissions
  if (!allowed.includes(session.role)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Inject userId and role into request headers for downstream handlers
  const res = NextResponse.next();
  res.headers.set("x-user-id", session.userId);
  res.headers.set("x-user-role", session.role);
  res.headers.set("x-user-email", session.email);
  return res;
}

export const config = {
  matcher: [
    "/team/:path*",
    "/reporting/:path*",
    "/video/:path*",
    "/contracts/:path*",
    "/invoicing/:path*",
    "/cases/:path*",
    "/evidence/:path*",
    "/tasks/:path*",
    "/clients/:path*",
    "/ops/:path*",
    "/settings/:path*",
    "/api/analytics/:path*",
    "/api/time-entries/:path*",
    "/api/expenses/:path*",
    "/api/cases/:path*",
    "/api/evidence/:path*",
    "/api/tasks/:path*",
    "/api/clients/:path*",
    "/api/contracts/:path*",
    "/api/invoices/:path*",
    "/api/video/ingest/:path*",
    "/api/team/:path*",
    "/api/exports/:path*",
    "/api/ops/:path*",
    "/api/users/:path*",
  ],
};
