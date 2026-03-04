// @vitest-environment node
/**
 * Workflow test: Login → access protected routes → denial without auth
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";
import { createSessionToken } from "@/lib/session";

function makeReq(pathname: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(new URL(pathname, "http://localhost:3000"));
  for (const [k, v] of Object.entries(cookies)) req.cookies.set(k, v);
  return req;
}

describe("auth workflow: login → access → denial", () => {
  it("unauthenticated user gets redirected from protected pages", async () => {
    const protectedPages = ["/reporting", "/team", "/video", "/contracts"];
    for (const page of protectedPages) {
      const res = await middleware(makeReq(page));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login");
    }
  });

  it("unauthenticated user gets 401 from protected APIs", async () => {
    const protectedApis = [
      "/api/analytics/overview",
      "/api/time-entries",
      "/api/expenses",
      "/api/contracts/create",
      "/api/ops/daily",
      "/api/team/summary",
      "/api/exports/time-entries.csv",
    ];
    for (const api of protectedApis) {
      const res = await middleware(makeReq(api));
      expect(res.status).toBe(401);
    }
  });

  it("authenticated owner can access all protected pages", async () => {
    const token = await createSessionToken({ userId: "u1", email: "o@t.com", role: "owner" });
    const protectedPages = ["/reporting", "/team", "/video", "/contracts"];
    for (const page of protectedPages) {
      const res = await middleware(makeReq(page, { session: token }));
      expect(res.status).toBe(200);
    }
  });

  it("authenticated owner can access all protected APIs", async () => {
    const token = await createSessionToken({ userId: "u1", email: "o@t.com", role: "owner" });
    const protectedApis = [
      "/api/analytics/overview",
      "/api/time-entries",
      "/api/expenses",
      "/api/contracts/create",
      "/api/ops/daily",
      "/api/team/summary",
      "/api/exports/time-entries.csv",
    ];
    for (const api of protectedApis) {
      const res = await middleware(makeReq(api, { session: token }));
      expect(res.status).toBe(200);
    }
  });

  it("client role is denied from all restricted pages and APIs", async () => {
    const token = await createSessionToken({ userId: "u1", email: "c@t.com", role: "client" });
    const restrictedPages = ["/reporting", "/video", "/contracts"];
    for (const page of restrictedPages) {
      const res = await middleware(makeReq(page, { session: token }));
      expect(res.status).toBe(307); // redirect to /
    }

    const restrictedApis = ["/api/analytics/overview", "/api/ops/daily"];
    for (const api of restrictedApis) {
      const res = await middleware(makeReq(api, { session: token }));
      expect(res.status).toBe(403);
    }
  });

  it("investigator can access team but not contracts", async () => {
    const token = await createSessionToken({ userId: "u1", email: "i@t.com", role: "investigator" });

    const allowed = await middleware(makeReq("/team", { session: token }));
    expect(allowed.status).toBe(200);

    const denied = await middleware(makeReq("/contracts", { session: token }));
    expect(denied.status).toBe(307);
  });
});
