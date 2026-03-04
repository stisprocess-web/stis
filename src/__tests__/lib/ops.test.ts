import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  task: { findMany: vi.fn() },
  case: { findMany: vi.fn(), groupBy: vi.fn() },
  timeEntry: { aggregate: vi.fn(), findMany: vi.fn() },
  expense: { aggregate: vi.fn(), findMany: vi.fn() },
  invoice: { findMany: vi.fn() },
  contractor: { findMany: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { getDailyOpsSnapshot, getWeeklyOwnerReport } from "@/lib/ops";

describe("ops", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDailyOpsSnapshot", () => {
    it("returns daily ops data", async () => {
      mockPrisma.task.findMany.mockResolvedValue([
        { id: "t1", done: false, dueDate: new Date("2020-01-01"), case: {} },
      ]);
      mockPrisma.case.findMany
        .mockResolvedValueOnce([]) // upcomingDueCases
        .mockResolvedValueOnce([ // cases for at-risk check
          {
            id: "c1",
            caseCode: "PI-001",
            title: "Stale Case",
            status: "ACTIVE",
            timeEntries: [],
            tasks: [{ done: false }],
          },
        ]);
      mockPrisma.timeEntry.aggregate.mockResolvedValue({
        _sum: { billableAmountUsd: 5000, hours: 40 },
      });
      mockPrisma.expense.aggregate.mockResolvedValue({ _sum: { amountUsd: 1500 } });
      mockPrisma.invoice.findMany.mockResolvedValue([
        { id: "inv1", status: "SENT", amountUsd: 3000, issuedDate: new Date() },
      ]);

      const result = await getDailyOpsSnapshot();

      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.overdueTasks).toHaveLength(1);
      expect(result.unbilled.hours).toBe(40);
      expect(result.unbilled.amountUsd).toBe(5000);
      expect(result.expenseQueueUsd).toBe(1500);
      expect(result.outstandingInvoices).toHaveLength(1);
      expect(result.arByStatus).toEqual({ SENT: 3000 });
      expect(result.atRiskCases).toHaveLength(1);
      expect(result.atRiskCases[0].caseCode).toBe("PI-001");
    });

    it("handles empty data", async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.case.findMany.mockResolvedValue([]);
      mockPrisma.timeEntry.aggregate.mockResolvedValue({ _sum: { billableAmountUsd: null, hours: null } });
      mockPrisma.expense.aggregate.mockResolvedValue({ _sum: { amountUsd: null } });
      mockPrisma.invoice.findMany.mockResolvedValue([]);

      const result = await getDailyOpsSnapshot();

      expect(result.overdueTasks).toHaveLength(0);
      expect(result.unbilled.hours).toBe(0);
      expect(result.unbilled.amountUsd).toBe(0);
      expect(result.expenseQueueUsd).toBe(0);
      expect(result.atRiskCases).toHaveLength(0);
    });

    it("computes arByStatus grouping", async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.case.findMany.mockResolvedValue([]);
      mockPrisma.timeEntry.aggregate.mockResolvedValue({ _sum: { billableAmountUsd: null, hours: null } });
      mockPrisma.expense.aggregate.mockResolvedValue({ _sum: { amountUsd: null } });
      mockPrisma.invoice.findMany.mockResolvedValue([
        { status: "DRAFT", amountUsd: 1000 },
        { status: "DRAFT", amountUsd: 2000 },
        { status: "OVERDUE", amountUsd: 500 },
      ]);

      const result = await getDailyOpsSnapshot();
      expect(result.arByStatus.DRAFT).toBe(3000);
      expect(result.arByStatus.OVERDUE).toBe(500);
    });
  });

  describe("getWeeklyOwnerReport", () => {
    it("returns weekly owner report with financials", async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([
        { status: "PAID", amountUsd: 10000 },
        { status: "SENT", amountUsd: 5000 },
        { status: "DRAFT", amountUsd: 2000 },
      ]);
      mockPrisma.timeEntry.findMany.mockResolvedValue([
        { billableAmountUsd: 3000, hours: 24, contractor: { name: "Alice" } },
        { billableAmountUsd: 2000, hours: 16, contractor: { name: "Bob" } },
      ]);
      mockPrisma.expense.findMany.mockResolvedValue([
        { amountUsd: 500, contractor: { name: "Alice" } },
      ]);
      mockPrisma.case.groupBy.mockResolvedValue([
        { status: "ACTIVE", _count: { _all: 5 } },
        { status: "CLOSED", _count: { _all: 3 } },
      ]);
      mockPrisma.contractor.findMany.mockResolvedValue([
        {
          name: "Alice",
          timeEntries: [{ hours: 24, billableAmountUsd: 3000 }],
          expenses: [{ amountUsd: 500 }],
        },
        {
          name: "Bob",
          timeEntries: [{ hours: 16, billableAmountUsd: 2000 }],
          expenses: [],
        },
      ]);

      const result = await getWeeklyOwnerReport();

      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.sevenDay.revenue7).toBe(15000); // PAID + SENT
      expect(result.sevenDay.labor7).toBe(5000);
      expect(result.sevenDay.expenses7).toBe(500);
      expect(result.sevenDay.margin7).toBe(9500);
      expect(result.casePipeline).toHaveLength(2);
      expect(result.investigatorPerformance).toHaveLength(2);
      expect(result.investigatorPerformance[0].name).toBe("Alice"); // Higher billable first
    });

    it("handles empty data", async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.timeEntry.findMany.mockResolvedValue([]);
      mockPrisma.expense.findMany.mockResolvedValue([]);
      mockPrisma.case.groupBy.mockResolvedValue([]);
      mockPrisma.contractor.findMany.mockResolvedValue([]);

      const result = await getWeeklyOwnerReport();
      expect(result.sevenDay.revenue7).toBe(0);
      expect(result.sevenDay.labor7).toBe(0);
      expect(result.sevenDay.expenses7).toBe(0);
      expect(result.sevenDay.margin7).toBe(0);
    });

    it("calculates productivity correctly", async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.timeEntry.findMany.mockResolvedValue([]);
      mockPrisma.expense.findMany.mockResolvedValue([]);
      mockPrisma.case.groupBy.mockResolvedValue([]);
      mockPrisma.contractor.findMany.mockResolvedValue([
        {
          name: "Zero Hours",
          timeEntries: [],
          expenses: [],
        },
        {
          name: "Has Hours",
          timeEntries: [{ hours: 10, billableAmountUsd: 1500 }],
          expenses: [],
        },
      ]);

      const result = await getWeeklyOwnerReport();
      const zeroHours = result.investigatorPerformance.find((i) => i.name === "Zero Hours");
      const hasHours = result.investigatorPerformance.find((i) => i.name === "Has Hours");
      expect(zeroHours!.productivity).toBe(0);
      expect(hasHours!.productivity).toBe(150); // 1500/10
    });
  });
});
