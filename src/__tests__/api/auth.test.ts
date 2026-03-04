// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

// Mock bcryptjs
const mockCompareSync = vi.hoisted(() => vi.fn());
vi.mock("bcryptjs", () => ({ compareSync: mockCompareSync }));

import { POST as loginPOST } from "@/app/api/auth/login/route";
import { POST as logoutPOST } from "@/app/api/auth/logout/route";
import { GET as meGET } from "@/app/api/auth/me/route";
import { NextRequest } from "next/server";
import { createSessionToken } from "@/lib/session";

function makeReq(url: string, opts: { method?: string; body?: unknown; cookies?: Record<string, string> } = {}) {
  const init: RequestInit = { method: opts.method || "GET" };
  if (opts.body) {
    init.headers = { "content-type": "application/json" };
    init.body = JSON.stringify(opts.body);
  }
  const req = new NextRequest(new URL(url, "http://localhost:3000"), init);
  if (opts.cookies) {
    for (const [k, v] of Object.entries(opts.cookies)) {
      req.cookies.set(k, v);
    }
  }
  return req;
}

describe("auth API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth/login", () => {
    it("returns 400 for invalid JSON body", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: "not json",
      });
      const res = await loginPOST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 for missing email or password", async () => {
      const req = makeReq("/api/auth/login", { method: "POST", body: { email: "" } });
      const res = await loginPOST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("required");
    });

    it("returns 401 for non-existent user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const req = makeReq("/api/auth/login", {
        method: "POST",
        body: { email: "nobody@test.com", password: "pass" },
      });
      const res = await loginPOST(req);
      expect(res.status).toBe(401);
    });

    it("returns 401 for wrong password", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "u1",
        email: "test@test.com",
        role: "owner",
        passwordHash: "$2a$10$hash",
      });
      mockCompareSync.mockReturnValue(false);

      const req = makeReq("/api/auth/login", {
        method: "POST",
        body: { email: "test@test.com", password: "wrong" },
      });
      const res = await loginPOST(req);
      expect(res.status).toBe(401);
    });

    it("returns 200 and sets session cookie on valid login", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "u1",
        email: "test@test.com",
        role: "owner",
        passwordHash: "$2a$10$hash",
      });
      mockCompareSync.mockReturnValue(true);

      const req = makeReq("/api/auth/login", {
        method: "POST",
        body: { email: "test@test.com", password: "correct" },
      });
      const res = await loginPOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.role).toBe("owner");

      const setCookie = res.headers.get("set-cookie");
      expect(setCookie).toContain("session=");
    });

    it("lowercases and trims email", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const req = makeReq("/api/auth/login", {
        method: "POST",
        body: { email: "  TEST@Test.com  ", password: "pass" },
      });
      await loginPOST(req);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "test@test.com" } });
    });
  });

  describe("POST /api/auth/logout", () => {
    it("returns 200 and clears cookie", async () => {
      const res = await logoutPOST();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      const setCookie = res.headers.get("set-cookie");
      expect(setCookie).toContain("Max-Age=0");
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns 401 without session cookie", async () => {
      const req = makeReq("/api/auth/me");
      const res = await meGET(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.authenticated).toBe(false);
    });

    it("returns authenticated user with valid session", async () => {
      const token = await createSessionToken({ userId: "u1", email: "a@b.com", role: "owner" });
      const req = makeReq("/api/auth/me", { cookies: { session: token } });
      const res = await meGET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.authenticated).toBe(true);
      expect(data.user.email).toBe("a@b.com");
      expect(data.user.role).toBe("owner");
    });

    it("returns 401 for invalid token", async () => {
      const req = makeReq("/api/auth/me", { cookies: { session: "invalid" } });
      const res = await meGET(req);
      expect(res.status).toBe(401);
    });
  });
});
