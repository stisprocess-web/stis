// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  timeEntry: { findMany: vi.fn() },
  expense: { findMany: vi.fn() },
  contractor: { findMany: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { GET as timeEntryCsvGET } from "@/app/api/exports/time-entries.csv/route";
import { GET as expensesCsvGET } from "@/app/api/exports/expenses.csv/route";
import { GET as qbTimeGET } from "@/app/api/exports/quickbooks-time.csv/route";
import { GET as qbExpensesGET } from "@/app/api/exports/quickbooks-expenses.csv/route";
import { GET as summaryGET } from "@/app/api/exports/1099-summary/route";
import { NextRequest } from "next/server";

describe("exports API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/exports/time-entries.csv", () => {
    it("returns CSV with correct headers", async () => {
      mockPrisma.timeEntry.findMany.mockResolvedValue([
        {
          entryCode: "TE-1",
          workDate: new Date("2024-01-15"),
          hours: 2.5,
          billableAmountUsd: 312.5,
          notes: "test",
          contractor: { name: "Alice" },
          case: { caseCode: "PI-001" },
        },
      ]);
      const res = await timeEntryCsvGET();
      expect(res.headers.get("Content-Type")).toContain("text/csv");
      const text = await res.text();
      expect(text).toContain("entryCode,workDate,contractor,caseCode,hours,billableAmountUsd,notes");
      expect(text).toContain("TE-1");
      expect(text).toContain("Alice");
    });
  });

  describe("GET /api/exports/expenses.csv", () => {
    it("returns CSV with expense data", async () => {
      mockPrisma.expense.findMany.mockResolvedValue([
        {
          expenseCode: "EX-1",
          spentDate: new Date("2024-01-15"),
          category: "Mileage",
          amountUsd: 45.5,
          status: "SUBMITTED",
          notes: "trip",
          contractor: { name: "Bob" },
          case: { caseCode: "PI-002" },
        },
      ]);
      const res = await expensesCsvGET();
      const text = await res.text();
      expect(text).toContain("expenseCode,spentDate,contractor,caseCode");
      expect(text).toContain("EX-1");
      expect(text).toContain("Bob");
    });
  });

  describe("GET /api/exports/quickbooks-time.csv", () => {
    it("returns QuickBooks format CSV", async () => {
      mockPrisma.timeEntry.findMany.mockResolvedValue([
        {
          workDate: new Date("2024-01-15"),
          hours: 4,
          billableAmountUsd: 500,
          notes: "work",
          contractor: { name: "Charlie" },
          case: { caseCode: "PI-003" },
        },
      ]);
      const res = await qbTimeGET();
      const text = await res.text();
      expect(text).toContain("Date,Employee,Customer,Service,Hours,BillableStatus,BillableRate");
      expect(text).toContain("Investigative Services");
      expect(text).toContain("Billable");
      expect(text).toContain("125.00"); // 500/4
    });
  });

  describe("GET /api/exports/quickbooks-expenses.csv", () => {
    it("returns QuickBooks expense format", async () => {
      mockPrisma.expense.findMany.mockResolvedValue([
        {
          spentDate: new Date("2024-01-15"),
          category: "Lodging",
          amountUsd: 200,
          notes: "hotel",
          contractor: { name: "Dan" },
          case: { caseCode: "PI-004" },
        },
      ]);
      const res = await qbExpensesGET();
      const text = await res.text();
      expect(text).toContain("Date,Payee,Category,Customer,Amount,Billable,Memo");
      expect(text).toContain("Dan");
      expect(text).toContain("200.00");
      expect(text).toContain("Yes");
    });
  });

  describe("GET /api/exports/1099-summary", () => {
    it("returns contractor summary JSON", async () => {
      mockPrisma.contractor.findMany.mockResolvedValue([
        {
          id: "ct1",
          contractorCode: "CT-001",
          name: "Eve",
          contractType: "C1099",
          timeEntries: [
            { workDate: new Date("2024-01-10"), hours: 10, billableAmountUsd: 1250 },
          ],
          expenses: [
            { spentDate: new Date("2024-01-12"), amountUsd: 100 },
          ],
        },
      ]);

      const req = new NextRequest("http://localhost:3000/api/exports/1099-summary?month=2024-01");
      const res = await summaryGET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.month).toBe("2024-01");
      expect(data.summary).toHaveLength(1);
      expect(data.summary[0].name).toBe("Eve");
    });

    it("returns 400 for invalid month format", async () => {
      const req = new NextRequest("http://localhost:3000/api/exports/1099-summary?month=invalid");
      const res = await summaryGET(req);
      expect(res.status).toBe(400);
    });

    it("defaults to current month when no param", async () => {
      mockPrisma.contractor.findMany.mockResolvedValue([]);
      const req = new NextRequest("http://localhost:3000/api/exports/1099-summary");
      const res = await summaryGET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.month).toMatch(/^\d{4}-\d{2}$/);
    });
  });
});
