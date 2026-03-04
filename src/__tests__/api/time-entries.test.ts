// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  timeEntry: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  caseAssignment: {
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { GET, POST } from "@/app/api/time-entries/route";
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
    for (const [k, v] of Object.entries(opts.cookies)) req.cookies.set(k, v);
  }
  return req;
}

describe("time-entries API", () => {
  let ownerToken: string;
  let billingToken: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    ownerToken = await createSessionToken({ userId: "u1", email: "o@t.com", role: "owner" });
    billingToken = await createSessionToken({ userId: "u2", email: "b@t.com", role: "billing" });
  });

  describe("GET /api/time-entries", () => {
    it("returns time entries list", async () => {
      mockPrisma.timeEntry.findMany.mockResolvedValue([
        { id: "te1", hours: 2, contractor: {}, case: {} },
      ]);
      const req = makeReq("/api/time-entries", { cookies: { session: ownerToken } });
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(1);
    });

    it("returns empty array when none exist", async () => {
      mockPrisma.timeEntry.findMany.mockResolvedValue([]);
      const req = makeReq("/api/time-entries", { cookies: { session: ownerToken } });
      const res = await GET(req);
      const data = await res.json();
      expect(data).toEqual([]);
    });
  });

  describe("POST /api/time-entries", () => {
    const validBody = {
      caseId: "ca1",
      contractorId: "ct1",
      workDate: "2024-01-15",
      hours: 2.5,
      billableAmountUsd: 312.5,
      notes: "surveillance",
    };

    it("creates time entry with valid data and owner role", async () => {
      mockPrisma.timeEntry.create.mockResolvedValue({ id: "te1", ...validBody });
      const req = makeReq("/api/time-entries", {
        method: "POST",
        body: validBody,
        cookies: { session: ownerToken },
      });
      const res = await POST(req);
      expect(res.status).toBe(201);
    });

    it("returns 403 for billing role", async () => {
      const req = makeReq("/api/time-entries", {
        method: "POST",
        body: validBody,
        cookies: { session: billingToken },
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it("returns 400 for invalid body", async () => {
      const req = makeReq("/api/time-entries", {
        method: "POST",
        body: { caseId: "", hours: -1 },
        cookies: { session: ownerToken },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 for missing body", async () => {
      const req = new NextRequest("http://localhost:3000/api/time-entries", {
        method: "POST",
        body: "not json",
      });
      req.cookies.set("session", ownerToken);
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("allows investigator role", async () => {
      const token = await createSessionToken({ userId: "u3", email: "i@t.com", role: "investigator" });
      mockPrisma.caseAssignment.findUnique.mockResolvedValue({ caseId: "ca1", userId: "u3" });
      mockPrisma.timeEntry.create.mockResolvedValue({ id: "te1" });
      const req = makeReq("/api/time-entries", {
        method: "POST",
        body: validBody,
        cookies: { session: token },
      });
      const res = await POST(req);
      expect(res.status).toBe(201);
    });
  });
});
