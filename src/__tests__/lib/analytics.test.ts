import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  case: { count: vi.fn() },
  task: { count: vi.fn() },
  evidence: { count: vi.fn() },
  invoice: { aggregate: vi.fn() },
  timeEntry: { aggregate: vi.fn() },
  expense: { aggregate: vi.fn() },
  contractor: { findMany: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { getAnalyticsOverview } from "@/lib/analytics";

describe("analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAnalyticsOverview", () => {
    it("returns aggregated analytics data", async () => {
      mockPrisma.case.count
        .mockResolvedValueOnce(3) // activeCases
        .mockResolvedValueOnce(10); // totalCases
      mockPrisma.task.count.mockResolvedValue(5);
      mockPrisma.evidence.count.mockResolvedValue(42);
      mockPrisma.invoice.aggregate.mockResolvedValue({ _sum: { amountUsd: 15000 } });
      mockPrisma.timeEntry.aggregate.mockResolvedValue({
        _sum: { hours: 120, billableAmountUsd: 15000 },
      });
      mockPrisma.expense.aggregate.mockResolvedValue({ _sum: { amountUsd: 2000 } });
      mockPrisma.contractor.findMany.mockResolvedValue([
        {
          contractorCode: "CT001",
          name: "Jane Investigator",
          contractType: "C1099",
          timeEntries: [
            { hours: 40, billableAmountUsd: 5000 },
            { hours: 20, billableAmountUsd: 2500 },
          ],
        },
      ]);

      const result = await getAnalyticsOverview();

      expect(result.activeCases).toBe(3);
      expect(result.totalCases).toBe(10);
      expect(result.openTasks).toBe(5);
      expect(result.totalEvidence).toBe(42);
      expect(result.unpaidInvoicesUsd).toBe(15000);
      expect(result.last30Days.billableHours).toBe(120);
      expect(result.last30Days.billableAmountUsd).toBe(15000);
      expect(result.last30Days.expensesUsd).toBe(2000);
      expect(result.topByBillables).toHaveLength(1);
      expect(result.topByBillables[0].name).toBe("Jane Investigator");
      expect(result.topByBillables[0].totalBillable).toBe(7500);
      expect(result.topByBillables[0].totalHours).toBe(60);
    });

    it("handles null aggregation sums", async () => {
      mockPrisma.case.count.mockResolvedValue(0);
      mockPrisma.task.count.mockResolvedValue(0);
      mockPrisma.evidence.count.mockResolvedValue(0);
      mockPrisma.invoice.aggregate.mockResolvedValue({ _sum: { amountUsd: null } });
      mockPrisma.timeEntry.aggregate.mockResolvedValue({
        _sum: { hours: null, billableAmountUsd: null },
      });
      mockPrisma.expense.aggregate.mockResolvedValue({ _sum: { amountUsd: null } });
      mockPrisma.contractor.findMany.mockResolvedValue([]);

      const result = await getAnalyticsOverview();

      expect(result.unpaidInvoicesUsd).toBe(0);
      expect(result.last30Days.billableHours).toBe(0);
      expect(result.last30Days.billableAmountUsd).toBe(0);
      expect(result.last30Days.expensesUsd).toBe(0);
      expect(result.topByBillables).toHaveLength(0);
    });

    it("limits top contractors to 5", async () => {
      mockPrisma.case.count.mockResolvedValue(0);
      mockPrisma.task.count.mockResolvedValue(0);
      mockPrisma.evidence.count.mockResolvedValue(0);
      mockPrisma.invoice.aggregate.mockResolvedValue({ _sum: { amountUsd: null } });
      mockPrisma.timeEntry.aggregate.mockResolvedValue({ _sum: { hours: null, billableAmountUsd: null } });
      mockPrisma.expense.aggregate.mockResolvedValue({ _sum: { amountUsd: null } });

      const contractors = Array.from({ length: 8 }, (_, i) => ({
        contractorCode: `CT00${i}`,
        name: `Contractor ${i}`,
        contractType: "C1099",
        timeEntries: [{ hours: 10 + i, billableAmountUsd: 1000 + i * 100 }],
      }));
      mockPrisma.contractor.findMany.mockResolvedValue(contractors);

      const result = await getAnalyticsOverview();
      expect(result.topByBillables).toHaveLength(5);
    });

    it("sorts top contractors by billable descending", async () => {
      mockPrisma.case.count.mockResolvedValue(0);
      mockPrisma.task.count.mockResolvedValue(0);
      mockPrisma.evidence.count.mockResolvedValue(0);
      mockPrisma.invoice.aggregate.mockResolvedValue({ _sum: { amountUsd: null } });
      mockPrisma.timeEntry.aggregate.mockResolvedValue({ _sum: { hours: null, billableAmountUsd: null } });
      mockPrisma.expense.aggregate.mockResolvedValue({ _sum: { amountUsd: null } });
      mockPrisma.contractor.findMany.mockResolvedValue([
        { contractorCode: "A", name: "Low", contractType: "C1099", timeEntries: [{ hours: 1, billableAmountUsd: 100 }] },
        { contractorCode: "B", name: "High", contractType: "C1099", timeEntries: [{ hours: 10, billableAmountUsd: 5000 }] },
      ]);

      const result = await getAnalyticsOverview();
      expect(result.topByBillables[0].name).toBe("High");
      expect(result.topByBillables[1].name).toBe("Low");
    });
  });
});
