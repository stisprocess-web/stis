// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  case: { findMany: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { GET } from "@/app/api/analytics/investigator-profitability/route";

describe("GET /api/analytics/investigator-profitability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns per-investigator margin analysis", async () => {
    mockPrisma.case.findMany.mockResolvedValue([
      {
        id: "c1",
        investigator: "Alice",
        invoices: [{ status: "PAID", amountUsd: 10000 }],
        timeEntries: [
          { billableAmountUsd: 3000, contractor: { name: "Alice" } },
          { billableAmountUsd: 2000, contractor: { name: "Bob" } },
        ],
        expenses: [
          { amountUsd: 500, contractor: { name: "Alice" } },
        ],
      },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBeGreaterThan(0);

    const alice = data.find((r: { investigator: string }) => r.investigator === "Alice");
    expect(alice).toBeDefined();
    expect(alice.labor).toBe(3000);
    expect(alice.expenses).toBe(500);
    expect(alice.caseCount).toBe(1);
  });

  it("attributes revenue proportionally by cost share", async () => {
    mockPrisma.case.findMany.mockResolvedValue([
      {
        id: "c1",
        investigator: "Default",
        invoices: [{ status: "PAID", amountUsd: 10000 }],
        timeEntries: [
          { billableAmountUsd: 6000, contractor: { name: "Expensive" } },
          { billableAmountUsd: 4000, contractor: { name: "Cheap" } },
        ],
        expenses: [],
      },
    ]);

    const res = await GET();
    const data = await res.json();
    const expensive = data.find((r: { investigator: string }) => r.investigator === "Expensive");
    const cheap = data.find((r: { investigator: string }) => r.investigator === "Cheap");
    // Expensive has 60% of cost, gets 60% of revenue = 6000
    expect(expensive.revenue).toBeCloseTo(6000);
    // Cheap has 40% of cost, gets 40% of revenue = 4000
    expect(cheap.revenue).toBeCloseTo(4000);
  });

  it("handles cases with no time/expense entries", async () => {
    mockPrisma.case.findMany.mockResolvedValue([
      {
        id: "c1",
        investigator: "Unassigned Lead",
        invoices: [{ status: "SENT", amountUsd: 5000 }],
        timeEntries: [],
        expenses: [],
      },
    ]);

    const res = await GET();
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].investigator).toBe("Unassigned Lead");
    expect(data[0].revenue).toBe(5000);
    expect(data[0].margin).toBe(5000);
  });

  it("uses 'Unassigned' when no investigator field and no entries", async () => {
    mockPrisma.case.findMany.mockResolvedValue([
      {
        id: "c1",
        investigator: null,
        invoices: [{ status: "PAID", amountUsd: 1000 }],
        timeEntries: [],
        expenses: [],
      },
    ]);

    const res = await GET();
    const data = await res.json();
    expect(data[0].investigator).toBe("Unassigned");
  });

  it("computes marginPct correctly", async () => {
    mockPrisma.case.findMany.mockResolvedValue([
      {
        id: "c1",
        investigator: "Alice",
        invoices: [{ status: "PAID", amountUsd: 10000 }],
        timeEntries: [{ billableAmountUsd: 5000, contractor: { name: "Alice" } }],
        expenses: [{ amountUsd: 1000, contractor: { name: "Alice" } }],
      },
    ]);

    const res = await GET();
    const data = await res.json();
    // Revenue: 10000, Labor: 5000, Expenses: 1000, Margin: 4000
    // MarginPct: (4000/10000)*100 = 40%
    expect(data[0].marginPct).toBe(40);
  });

  it("sorts by margin descending", async () => {
    mockPrisma.case.findMany.mockResolvedValue([
      {
        id: "c1", investigator: null,
        invoices: [{ status: "PAID", amountUsd: 2000 }],
        timeEntries: [{ billableAmountUsd: 1500, contractor: { name: "Low" } }],
        expenses: [],
      },
      {
        id: "c2", investigator: null,
        invoices: [{ status: "PAID", amountUsd: 20000 }],
        timeEntries: [{ billableAmountUsd: 5000, contractor: { name: "High" } }],
        expenses: [],
      },
    ]);

    const res = await GET();
    const data = await res.json();
    expect(data[0].investigator).toBe("High");
  });

  it("returns 500 on error", async () => {
    mockPrisma.case.findMany.mockRejectedValue(new Error("DB error"));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
