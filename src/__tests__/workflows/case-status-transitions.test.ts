// @vitest-environment node
/**
 * Workflow test: Case status transitions with guardrails
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  case: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { PATCH } from "@/app/api/cases/[id]/status/route";
import { NextRequest } from "next/server";
import { createSessionToken } from "@/lib/session";

function makeReq(body: unknown, token: string) {
  const req = new NextRequest("http://localhost:3000/api/cases/case1/status", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  req.cookies.set("session", token);
  return req;
}

describe("workflow: case status transitions with guardrails", () => {
  let ownerToken: string;
  const ctx = { params: Promise.resolve({ id: "case1" }) };

  beforeEach(async () => {
    vi.clearAllMocks();
    ownerToken = await createSessionToken({ userId: "u1", email: "o@t.com", role: "owner" });
  });

  it("INTAKE → ACTIVE: requires title and client", async () => {
    // Without title — should fail
    mockPrisma.case.findUnique.mockResolvedValue({
      id: "case1", title: "", clientId: "c1", status: "INTAKE",
      tasks: [], evidenceItems: [], invoices: [],
    });

    let res = await PATCH(makeReq({ status: "ACTIVE" }, ownerToken), ctx);
    expect(res.status).toBe(400);

    // Without client — should fail
    mockPrisma.case.findUnique.mockResolvedValue({
      id: "case1", title: "Has Title", clientId: null, status: "INTAKE",
      tasks: [], evidenceItems: [], invoices: [],
    });

    res = await PATCH(makeReq({ status: "ACTIVE" }, ownerToken), ctx);
    expect(res.status).toBe(400);

    // With both — should succeed
    mockPrisma.case.findUnique.mockResolvedValue({
      id: "case1", title: "Has Title", clientId: "c1", status: "INTAKE",
      tasks: [], evidenceItems: [], invoices: [],
    });
    mockPrisma.case.update.mockResolvedValue({ id: "case1", status: "ACTIVE" });

    res = await PATCH(makeReq({ status: "ACTIVE" }, ownerToken), ctx);
    expect(res.status).toBe(200);
  });

  it("ACTIVE → CLOSED: requires tasks done, evidence, and invoice", async () => {
    // Open tasks — should fail
    mockPrisma.case.findUnique.mockResolvedValue({
      id: "case1", title: "Test", clientId: "c1", status: "ACTIVE",
      tasks: [{ done: false }], evidenceItems: [{ id: "e1" }], invoices: [{ status: "PAID" }],
    });

    let res = await PATCH(makeReq({ status: "CLOSED" }, ownerToken), ctx);
    expect(res.status).toBe(400);

    // No evidence — should fail
    mockPrisma.case.findUnique.mockResolvedValue({
      id: "case1", title: "Test", clientId: "c1", status: "ACTIVE",
      tasks: [], evidenceItems: [], invoices: [{ status: "PAID" }],
    });

    res = await PATCH(makeReq({ status: "CLOSED" }, ownerToken), ctx);
    expect(res.status).toBe(400);

    // No sent/paid invoice — should fail
    mockPrisma.case.findUnique.mockResolvedValue({
      id: "case1", title: "Test", clientId: "c1", status: "ACTIVE",
      tasks: [], evidenceItems: [{ id: "e1" }], invoices: [{ status: "DRAFT" }],
    });

    res = await PATCH(makeReq({ status: "CLOSED" }, ownerToken), ctx);
    expect(res.status).toBe(400);

    // All conditions met — should succeed
    mockPrisma.case.findUnique.mockResolvedValue({
      id: "case1", title: "Test", clientId: "c1", status: "ACTIVE",
      tasks: [], evidenceItems: [{ id: "e1" }], invoices: [{ status: "PAID" }],
    });
    mockPrisma.case.update.mockResolvedValue({ id: "case1", status: "CLOSED" });

    res = await PATCH(makeReq({ status: "CLOSED" }, ownerToken), ctx);
    expect(res.status).toBe(200);
  });

  it("PENDING status transition works without special guardrails", async () => {
    mockPrisma.case.findUnique.mockResolvedValue({
      id: "case1", title: "Test", clientId: "c1", status: "ACTIVE",
      tasks: [], evidenceItems: [], invoices: [],
    });
    mockPrisma.case.update.mockResolvedValue({ id: "case1", status: "PENDING" });

    const res = await PATCH(makeReq({ status: "PENDING" }, ownerToken), ctx);
    expect(res.status).toBe(200);
  });

  it("only caseManagement roles (owner, admin) can transition status", async () => {
    const investigatorToken = await createSessionToken({ userId: "u2", email: "i@t.com", role: "investigator" });
    const billingToken = await createSessionToken({ userId: "u3", email: "b@t.com", role: "billing" });
    const clientToken = await createSessionToken({ userId: "u4", email: "c@t.com", role: "client" });

    for (const token of [investigatorToken, billingToken, clientToken]) {
      const res = await PATCH(makeReq({ status: "ACTIVE" }, token), ctx);
      expect(res.status).toBe(403);
    }

    // Admin should work
    const adminToken = await createSessionToken({ userId: "u5", email: "a@t.com", role: "admin" });
    mockPrisma.case.findUnique.mockResolvedValue({
      id: "case1", title: "Test", clientId: "c1",
      tasks: [], evidenceItems: [], invoices: [],
    });
    mockPrisma.case.update.mockResolvedValue({ id: "case1", status: "ACTIVE" });

    const res = await PATCH(makeReq({ status: "ACTIVE" }, adminToken), ctx);
    expect(res.status).toBe(200);
  });

  it("rejects invalid status values", async () => {
    const res = await PATCH(makeReq({ status: "DELETED" }, ownerToken), ctx);
    expect(res.status).toBe(400);
  });
});
