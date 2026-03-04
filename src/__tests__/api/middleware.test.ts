// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";
import { createSessionToken } from "@/lib/session";

function makeReq(pathname: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(new URL(pathname, "http://localhost:3000"));
  for (const [k, v] of Object.entries(cookies)) {
    req.cookies.set(k, v);
  }
  return req;
}

describe("middleware", () => {
  describe("unprotected routes", () => {
    it("passes through for / (no restriction)", async () => {
      const req = makeReq("/");
      const res = await middleware(req);
      expect(res.status).toBe(200);
    });

    it("passes through for /login", async () => {
      const req = makeReq("/login");
      const res = await middleware(req);
      expect(res.status).toBe(200);
    });
  });

  describe("unauthenticated access", () => {
    it("redirects to /login for protected page without session", async () => {
      const req = makeReq("/reporting");
      const res = await middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login");
    });

    it("returns 401 for protected API without session", async () => {
      const req = makeReq("/api/analytics/overview");
      const res = await middleware(req);
      expect(res.status).toBe(401);
    });
  });

  describe("role-based access", () => {
    it("allows owner to access /reporting", async () => {
      const token = await createSessionToken({ userId: "u1", email: "o@t.com", role: "owner" });
      const req = makeReq("/reporting", { session: token });
      const res = await middleware(req);
      expect(res.status).toBe(200);
    });

    it("allows billing to access /reporting", async () => {
      const token = await createSessionToken({ userId: "u1", email: "b@t.com", role: "billing" });
      const req = makeReq("/reporting", { session: token });
      const res = await middleware(req);
      expect(res.status).toBe(200);
    });

    it("denies client access to /reporting (redirects)", async () => {
      const token = await createSessionToken({ userId: "u1", email: "c@t.com", role: "client" });
      const req = makeReq("/reporting", { session: token });
      const res = await middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/");
    });

    it("denies investigator access to /contracts (redirects)", async () => {
      const token = await createSessionToken({ userId: "u1", email: "i@t.com", role: "investigator" });
      const req = makeReq("/contracts", { session: token });
      const res = await middleware(req);
      expect(res.status).toBe(307);
    });

    it("returns 403 for investigator on /api/analytics", async () => {
      const token = await createSessionToken({ userId: "u1", email: "i@t.com", role: "investigator" });
      const req = makeReq("/api/analytics/overview", { session: token });
      const res = await middleware(req);
      expect(res.status).toBe(403);
    });

    it("allows investigator access to /api/time-entries", async () => {
      const token = await createSessionToken({ userId: "u1", email: "i@t.com", role: "investigator" });
      const req = makeReq("/api/time-entries", { session: token });
      const res = await middleware(req);
      expect(res.status).toBe(200);
    });

    it("allows billing to access /api/expenses", async () => {
      const token = await createSessionToken({ userId: "u1", email: "b@t.com", role: "billing" });
      const req = makeReq("/api/expenses", { session: token });
      const res = await middleware(req);
      expect(res.status).toBe(200);
    });

    it("denies client access to /api/ops/daily", async () => {
      const token = await createSessionToken({ userId: "u1", email: "c@t.com", role: "client" });
      const req = makeReq("/api/ops/daily", { session: token });
      const res = await middleware(req);
      expect(res.status).toBe(403);
    });

    it("allows owner to access /api/ops/daily", async () => {
      const token = await createSessionToken({ userId: "u1", email: "o@t.com", role: "owner" });
      const req = makeReq("/api/ops/daily", { session: token });
      const res = await middleware(req);
      expect(res.status).toBe(200);
    });
  });
});
