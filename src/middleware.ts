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

/** Route prefix → allowed roles mapping. */
const roleRules: ReadonlyArray<{ prefix: string; roles: readonly string[] }> = [
  { prefix: "/reporting", roles: ["owner", "admin", "billing"] },
  { prefix: "/team", roles: ["owner", "admin", "investigator", "billing"] },
  { prefix: "/video", roles: ["owner", "admin", "investigator"] },
  { prefix: "/contracts", roles: ["owner", "admin", "billing"] },
  { prefix: "/api/analytics", roles: ["owner", "admin", "billing"] },
  { prefix: "/api/time-entries", roles: ["owner", "admin", "investigator"] },
  { prefix: "/api/expenses", roles: ["owner", "admin", "investigator", "billing"] },
  { prefix: "/api/cases", roles: ["owner", "admin", "billing"] },
  { prefix: "/api/contracts", roles: ["owner", "admin", "billing"] },
  { prefix: "/api/video/ingest", roles: ["owner", "admin", "investigator"] },
  { prefix: "/api/team", roles: ["owner", "admin", "billing"] },
  { prefix: "/api/exports", roles: ["owner", "admin", "billing"] },
  { prefix: "/api/ops", roles: ["owner", "admin"] },
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/team/:path*",
    "/reporting/:path*",
    "/video/:path*",
    "/contracts/:path*",
    "/api/analytics/:path*",
    "/api/time-entries/:path*",
    "/api/expenses/:path*",
    "/api/cases/:path*",
    "/api/contracts/:path*",
    "/api/video/ingest/:path*",
    "/api/team/:path*",
    "/api/exports/:path*",
    "/api/ops/:path*",
  ],
};
