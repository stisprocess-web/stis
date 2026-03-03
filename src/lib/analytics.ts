/**
 * @module lib/analytics
 * Analytics query functions for the reporting dashboard.
 *
 * All functions return plain objects suitable for JSON serialization.
 */

import { prisma } from "@/lib/prisma";

/** Shape of the analytics overview response. */
export interface AnalyticsOverview {
  activeCases: number;
  totalCases: number;
  openTasks: number;
  totalEvidence: number;
  unpaidInvoicesUsd: number;
  last30Days: {
    billableHours: number;
    billableAmountUsd: number;
    expensesUsd: number;
  };
  topByBillables: Array<{
    contractorCode: string;
    name: string;
    totalBillable: number;
    totalHours: number;
  }>;
}

/**
 * Compute a high-level analytics overview spanning the last 30 days.
 * Includes case counts, task counts, invoice totals, and top contractors.
 */
export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const now = new Date();
  const start30 = new Date(now);
  start30.setDate(now.getDate() - 30);

  const [
    activeCases,
    totalCases,
    openTasks,
    totalEvidence,
    unpaidInvoiceAgg,
    time30Agg,
    expense30Agg,
    topContractors,
  ] = await Promise.all([
    prisma.case.count({ where: { status: "ACTIVE" } }),
    prisma.case.count(),
    prisma.task.count({ where: { done: false } }),
    prisma.evidence.count(),
    prisma.invoice.aggregate({
      _sum: { amountUsd: true },
      where: { status: { in: ["DRAFT", "SENT", "OVERDUE"] } },
    }),
    prisma.timeEntry.aggregate({
      _sum: { hours: true, billableAmountUsd: true },
      where: { workDate: { gte: start30 } },
    }),
    prisma.expense.aggregate({
      _sum: { amountUsd: true },
      where: { spentDate: { gte: start30 } },
    }),
    prisma.contractor.findMany({
      where: { contractType: "C1099" },
      include: { timeEntries: true },
    }),
  ]);

  const topByBillables = topContractors
    .map((c) => ({
      contractorCode: c.contractorCode,
      name: c.name,
      totalBillable: c.timeEntries.reduce((sum, t) => sum + t.billableAmountUsd, 0),
      totalHours: c.timeEntries.reduce((sum, t) => sum + t.hours, 0),
    }))
    .sort((a, b) => b.totalBillable - a.totalBillable)
    .slice(0, 5);

  return {
    activeCases,
    totalCases,
    openTasks,
    totalEvidence,
    unpaidInvoicesUsd: unpaidInvoiceAgg._sum.amountUsd ?? 0,
    last30Days: {
      billableHours: time30Agg._sum.hours ?? 0,
      billableAmountUsd: time30Agg._sum.billableAmountUsd ?? 0,
      expensesUsd: expense30Agg._sum.amountUsd ?? 0,
    },
    topByBillables,
  };
}
