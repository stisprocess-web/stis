// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  expense: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { GET, POST, PATCH } from "@/app/api/expenses/route";
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

describe("expenses API", () => {
  let ownerToken: string;
  let clientToken: string;
  let billingToken: string;
  let investigatorToken: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    ownerToken = await createSessionToken({ userId: "u1", email: "o@t.com", role: "owner" });
    clientToken = await createSessionToken({ userId: "u2", email: "c@t.com", role: "client" });
    billingToken = await createSessionToken({ userId: "u3", email: "b@t.com", role: "billing" });
    investigatorToken = await createSessionToken({ userId: "u4", email: "i@t.com", role: "investigator" });
  });

  describe("GET /api/expenses", () => {
    it("returns expenses list", async () => {
      mockPrisma.expense.findMany.mockResolvedValue([{ id: "e1" }]);
      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(1);
    });
  });

  describe("POST /api/expenses", () => {
    const validBody = {
      caseId: "ca1",
      contractorId: "ct1",
      category: "Mileage",
      amountUsd: 45.50,
      spentDate: "2024-01-15",
      notes: "trip",
    };

    it("creates expense with investigator role", async () => {
      mockPrisma.expense.create.mockResolvedValue({ id: "e1" });
      const req = makeReq("/api/expenses", {
        method: "POST",
        body: validBody,
        cookies: { session: investigatorToken },
      });
      const res = await POST(req);
      expect(res.status).toBe(201);
    });

    it("returns 403 for billing role (cannot submit expenses)", async () => {
      const req = makeReq("/api/expenses", {
        method: "POST",
        body: validBody,
        cookies: { session: billingToken },
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it("returns 403 for client role", async () => {
      const req = makeReq("/api/expenses", {
        method: "POST",
        body: validBody,
        cookies: { session: clientToken },
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it("returns 400 for invalid data", async () => {
      const req = makeReq("/api/expenses", {
        method: "POST",
        body: { ...validBody, amountUsd: -10 },
        cookies: { session: ownerToken },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("sets status to SUBMITTED", async () => {
      mockPrisma.expense.create.mockResolvedValue({ id: "e1", status: "SUBMITTED" });
      const req = makeReq("/api/expenses", {
        method: "POST",
        body: validBody,
        cookies: { session: ownerToken },
      });
      await POST(req);
      expect(mockPrisma.expense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "SUBMITTED" }),
        }),
      );
    });
  });

  describe("PATCH /api/expenses", () => {
    it("updates expense status with billing role", async () => {
      mockPrisma.expense.update.mockResolvedValue({ id: "e1", status: "APPROVED" });
      const req = makeReq("/api/expenses", {
        method: "PATCH",
        body: { id: "e1", status: "APPROVED" },
        cookies: { session: billingToken },
      });
      const res = await PATCH(req);
      expect(res.status).toBe(200);
    });

    it("returns 403 for investigator (cannot approve)", async () => {
      const req = makeReq("/api/expenses", {
        method: "PATCH",
        body: { id: "e1", status: "APPROVED" },
        cookies: { session: investigatorToken },
      });
      const res = await PATCH(req);
      expect(res.status).toBe(403);
    });

    it("returns 400 for invalid status", async () => {
      const req = makeReq("/api/expenses", {
        method: "PATCH",
        body: { id: "e1", status: "INVALID" },
        cookies: { session: ownerToken },
      });
      const res = await PATCH(req);
      expect(res.status).toBe(400);
    });

    it("allows owner to approve expenses", async () => {
      mockPrisma.expense.update.mockResolvedValue({ id: "e1", status: "REIMBURSED" });
      const req = makeReq("/api/expenses", {
        method: "PATCH",
        body: { id: "e1", status: "REIMBURSED" },
        cookies: { session: ownerToken },
      });
      const res = await PATCH(req);
      expect(res.status).toBe(200);
    });
  });
});
