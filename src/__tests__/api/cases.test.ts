// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  case: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { PATCH } from "@/app/api/cases/[id]/status/route";
import { GET } from "@/app/api/cases/[id]/billing-readiness/route";
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

describe("cases API routes", () => {
  let ownerToken: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    ownerToken = await createSessionToken({ userId: "u1", email: "o@t.com", role: "owner" });
  });

  describe("PATCH /api/cases/[id]/status", () => {
    const ctx = { params: Promise.resolve({ id: "case1" }) };

    it("returns 403 for unauthorized role", async () => {
      const token = await createSessionToken({ userId: "u2", email: "c@t.com", role: "client" });
      const req = makeReq("/api/cases/case1/status", {
        method: "PATCH",
        body: { status: "ACTIVE" },
        cookies: { session: token },
      });
      const res = await PATCH(req, ctx);
      expect(res.status).toBe(403);
    });

    it("returns 400 for invalid status", async () => {
      const req = makeReq("/api/cases/case1/status", {
        method: "PATCH",
        body: { status: "DELETED" },
        cookies: { session: ownerToken },
      });
      const res = await PATCH(req, ctx);
      expect(res.status).toBe(400);
    });

    it("returns 404 for non-existent case", async () => {
      mockPrisma.case.findUnique.mockResolvedValue(null);
      const req = makeReq("/api/cases/case1/status", {
        method: "PATCH",
        body: { status: "ACTIVE" },
        cookies: { session: ownerToken },
      });
      const res = await PATCH(req, ctx);
      expect(res.status).toBe(404);
    });

    it("returns 400 if ACTIVE without title", async () => {
      mockPrisma.case.findUnique.mockResolvedValue({
        id: "case1",
        title: "",
        clientId: "c1",
        tasks: [],
        evidenceItems: [],
        invoices: [],
      });
      const req = makeReq("/api/cases/case1/status", {
        method: "PATCH",
        body: { status: "ACTIVE" },
        cookies: { session: ownerToken },
      });
      const res = await PATCH(req, ctx);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("title");
    });

    it("returns 400 if ACTIVE without clientId", async () => {
      mockPrisma.case.findUnique.mockResolvedValue({
        id: "case1",
        title: "Test Case",
        clientId: null,
        tasks: [],
        evidenceItems: [],
        invoices: [],
      });
      const req = makeReq("/api/cases/case1/status", {
        method: "PATCH",
        body: { status: "ACTIVE" },
        cookies: { session: ownerToken },
      });
      const res = await PATCH(req, ctx);
      expect(res.status).toBe(400);
    });

    it("returns 400 if CLOSED with open tasks", async () => {
      mockPrisma.case.findUnique.mockResolvedValue({
        id: "case1",
        title: "Test",
        clientId: "c1",
        tasks: [{ done: false }],
        evidenceItems: [{ id: "e1" }],
        invoices: [{ status: "PAID" }],
      });
      const req = makeReq("/api/cases/case1/status", {
        method: "PATCH",
        body: { status: "CLOSED" },
        cookies: { session: ownerToken },
      });
      const res = await PATCH(req, ctx);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("open tasks");
    });

    it("returns 400 if CLOSED without evidence", async () => {
      mockPrisma.case.findUnique.mockResolvedValue({
        id: "case1",
        title: "Test",
        clientId: "c1",
        tasks: [],
        evidenceItems: [],
        invoices: [{ status: "PAID" }],
      });
      const req = makeReq("/api/cases/case1/status", {
        method: "PATCH",
        body: { status: "CLOSED" },
        cookies: { session: ownerToken },
      });
      const res = await PATCH(req, ctx);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("evidence");
    });

    it("returns 400 if CLOSED without sent/paid invoice", async () => {
      mockPrisma.case.findUnique.mockResolvedValue({
        id: "case1",
        title: "Test",
        clientId: "c1",
        tasks: [],
        evidenceItems: [{ id: "e1" }],
        invoices: [{ status: "DRAFT" }],
      });
      const req = makeReq("/api/cases/case1/status", {
        method: "PATCH",
        body: { status: "CLOSED" },
        cookies: { session: ownerToken },
      });
      const res = await PATCH(req, ctx);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("invoice");
    });

    it("successfully transitions to ACTIVE", async () => {
      mockPrisma.case.findUnique.mockResolvedValue({
        id: "case1",
        title: "Test Case",
        clientId: "c1",
        tasks: [],
        evidenceItems: [],
        invoices: [],
      });
      mockPrisma.case.update.mockResolvedValue({ id: "case1", status: "ACTIVE" });

      const req = makeReq("/api/cases/case1/status", {
        method: "PATCH",
        body: { status: "ACTIVE" },
        cookies: { session: ownerToken },
      });
      const res = await PATCH(req, ctx);
      expect(res.status).toBe(200);
    });

    it("successfully transitions to CLOSED when all conditions met", async () => {
      mockPrisma.case.findUnique.mockResolvedValue({
        id: "case1",
        title: "Test",
        clientId: "c1",
        tasks: [],
        evidenceItems: [{ id: "e1" }],
        invoices: [{ status: "PAID" }],
      });
      mockPrisma.case.update.mockResolvedValue({ id: "case1", status: "CLOSED" });

      const req = makeReq("/api/cases/case1/status", {
        method: "PATCH",
        body: { status: "CLOSED" },
        cookies: { session: ownerToken },
      });
      const res = await PATCH(req, ctx);
      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/cases/[id]/billing-readiness", () => {
    const ctx = { params: Promise.resolve({ id: "case1" }) };

    it("returns 404 for non-existent case", async () => {
      mockPrisma.case.findUnique.mockResolvedValue(null);
      const req = makeReq("/api/cases/case1/billing-readiness");
      const res = await GET(req, ctx);
      expect(res.status).toBe(404);
    });

    it("returns ready=true when all conditions met", async () => {
      mockPrisma.case.findUnique.mockResolvedValue({
        id: "case1",
        caseCode: "PI-001",
        tasks: [{ done: true }],
        expenses: [{ status: "APPROVED" }],
        timeEntries: [{ id: "te1" }],
        invoices: [{ status: "DRAFT" }],
      });
      const req = makeReq("/api/cases/case1/billing-readiness");
      const res = await GET(req, ctx);
      const data = await res.json();
      expect(data.ready).toBe(true);
      expect(data.checks.openTasks).toBe(0);
      expect(data.checks.hasTime).toBe(true);
    });

    it("returns ready=false with open tasks", async () => {
      mockPrisma.case.findUnique.mockResolvedValue({
        id: "case1",
        caseCode: "PI-001",
        tasks: [{ done: false }],
        expenses: [],
        timeEntries: [{ id: "te1" }],
        invoices: [],
      });
      const req = makeReq("/api/cases/case1/billing-readiness");
      const res = await GET(req, ctx);
      const data = await res.json();
      expect(data.ready).toBe(false);
      expect(data.checks.openTasks).toBe(1);
    });

    it("returns ready=false without time entries", async () => {
      mockPrisma.case.findUnique.mockResolvedValue({
        id: "case1",
        caseCode: "PI-001",
        tasks: [],
        expenses: [],
        timeEntries: [],
        invoices: [],
      });
      const req = makeReq("/api/cases/case1/billing-readiness");
      const res = await GET(req, ctx);
      const data = await res.json();
      expect(data.ready).toBe(false);
      expect(data.checks.hasTime).toBe(false);
    });
  });
});
