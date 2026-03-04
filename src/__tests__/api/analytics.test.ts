// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetAnalyticsOverview = vi.hoisted(() => vi.fn());
vi.mock("@/lib/analytics", () => ({ getAnalyticsOverview: mockGetAnalyticsOverview }));

const mockPrisma = vi.hoisted(() => ({
  case: { findMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { GET as overviewGET } from "@/app/api/analytics/overview/route";
import { GET as profitabilityGET } from "@/app/api/analytics/profitability/route";

describe("analytics API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/analytics/overview", () => {
    it("returns analytics overview", async () => {
      const mockData = { activeCases: 3, totalCases: 10 };
      mockGetAnalyticsOverview.mockResolvedValue(mockData);

      const res = await overviewGET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.activeCases).toBe(3);
    });

    it("returns 500 on error", async () => {
      mockGetAnalyticsOverview.mockRejectedValue(new Error("DB error"));
      const res = await overviewGET();
      expect(res.status).toBe(500);
    });
  });

  describe("GET /api/analytics/profitability", () => {
    it("returns profitability data sorted by margin", async () => {
      mockPrisma.case.findMany.mockResolvedValue([
        {
          id: "c1",
          caseCode: "PI-001",
          title: "Case 1",
          client: { company: "Acme" },
          invoices: [{ status: "PAID", amountUsd: 10000 }],
          timeEntries: [{ billableAmountUsd: 3000 }],
          expenses: [{ amountUsd: 1000 }],
        },
        {
          id: "c2",
          caseCode: "PI-002",
          title: "Case 2",
          client: { company: "Beta" },
          invoices: [{ status: "SENT", amountUsd: 5000 }],
          timeEntries: [{ billableAmountUsd: 4000 }],
          expenses: [{ amountUsd: 500 }],
        },
      ]);

      const res = await profitabilityGET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(2);
      // Case 1: margin = 10000-3000-1000 = 6000
      // Case 2: margin = 5000-4000-500 = 500
      expect(data[0].caseCode).toBe("PI-001");
      expect(data[0].margin).toBe(6000);
      expect(data[1].margin).toBe(500);
    });

    it("excludes DRAFT invoices from revenue", async () => {
      mockPrisma.case.findMany.mockResolvedValue([
        {
          id: "c1",
          caseCode: "PI-001",
          title: "Test",
          client: { company: "Co" },
          invoices: [{ status: "DRAFT", amountUsd: 10000 }],
          timeEntries: [],
          expenses: [],
        },
      ]);
      const res = await profitabilityGET();
      const data = await res.json();
      expect(data[0].revenue).toBe(0);
    });
  });
});
