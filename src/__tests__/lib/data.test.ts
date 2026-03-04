import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  case: { findMany: vi.fn() },
  client: { findMany: vi.fn() },
  task: { findMany: vi.fn() },
  evidence: { findMany: vi.fn(), count: vi.fn() },
  invoice: { findMany: vi.fn() },
  timeEntry: { findMany: vi.fn() },
  expense: { findMany: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { getDashboardData, getCases, getClients, getEvidenceItems, getTasks, getInvoicingData } from "@/lib/data";

describe("data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDashboardData", () => {
    it("returns KPIs and lists", async () => {
      mockPrisma.case.findMany.mockResolvedValue([
        { id: "1", status: "ACTIVE", client: {} },
        { id: "2", status: "CLOSED", client: {} },
      ]);
      mockPrisma.task.findMany.mockResolvedValue([
        { id: "t1", done: false, case: {} },
      ]);
      mockPrisma.evidence.count.mockResolvedValue(10);
      mockPrisma.invoice.findMany.mockResolvedValue([
        { id: "i1", status: "SENT", amountUsd: 5000, client: {} },
        { id: "i2", status: "PAID", amountUsd: 3000, client: {} },
      ]);

      const result = await getDashboardData();

      expect(result.kpis.activeCases).toBe(1);
      expect(result.kpis.openTasks).toBe(1);
      expect(result.kpis.evidenceCount).toBe(10);
      expect(result.kpis.unpaidInvoices).toBe(5000);
      expect(result.cases).toHaveLength(2);
      expect(result.tasks).toHaveLength(1);
      expect(result.invoices).toHaveLength(2);
    });

    it("handles empty data", async () => {
      mockPrisma.case.findMany.mockResolvedValue([]);
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.evidence.count.mockResolvedValue(0);
      mockPrisma.invoice.findMany.mockResolvedValue([]);

      const result = await getDashboardData();

      expect(result.kpis.activeCases).toBe(0);
      expect(result.kpis.openTasks).toBe(0);
      expect(result.kpis.evidenceCount).toBe(0);
      expect(result.kpis.unpaidInvoices).toBe(0);
    });
  });

  describe("getCases", () => {
    it("fetches cases with client relation", async () => {
      mockPrisma.case.findMany.mockResolvedValue([{ id: "1", client: {} }]);
      const result = await getCases();
      expect(result).toHaveLength(1);
      expect(mockPrisma.case.findMany).toHaveBeenCalledWith({
        include: { client: true },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      });
    });
  });

  describe("getClients", () => {
    it("fetches clients ordered by name", async () => {
      mockPrisma.client.findMany.mockResolvedValue([{ id: "1", name: "Alpha" }]);
      const result = await getClients();
      expect(result).toHaveLength(1);
      expect(mockPrisma.client.findMany).toHaveBeenCalledWith({ orderBy: { name: "asc" } });
    });
  });

  describe("getEvidenceItems", () => {
    it("fetches evidence with case and uploadedBy", async () => {
      mockPrisma.evidence.findMany.mockResolvedValue([{ id: "1", case: {}, uploadedBy: {} }]);
      const result = await getEvidenceItems();
      expect(result).toHaveLength(1);
      expect(mockPrisma.evidence.findMany).toHaveBeenCalledWith({
        include: { case: true, uploadedBy: true },
        orderBy: { uploadedAt: "desc" },
      });
    });
  });

  describe("getTasks", () => {
    it("fetches tasks with case relation", async () => {
      mockPrisma.task.findMany.mockResolvedValue([{ id: "1", case: {} }]);
      const result = await getTasks();
      expect(result).toHaveLength(1);
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        include: { case: true },
        orderBy: [{ done: "asc" }, { dueDate: "asc" }],
      });
    });
  });

  describe("getInvoicingData", () => {
    it("fetches invoices, time entries, and expenses", async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([{ id: "i1" }]);
      mockPrisma.timeEntry.findMany.mockResolvedValue([{ id: "te1" }]);
      mockPrisma.expense.findMany.mockResolvedValue([{ id: "e1" }]);

      const result = await getInvoicingData();
      expect(result.invoices).toHaveLength(1);
      expect(result.timeEntries).toHaveLength(1);
      expect(result.expenses).toHaveLength(1);
    });
  });
});
