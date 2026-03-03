/**
 * @module lib/ops
 * Operational intelligence queries — daily snapshots and weekly owner reports.
 *
 * These functions aggregate data across cases, tasks, invoices, and contractors
 * to surface actionable insights for daily operations and weekly reviews.
 */

import { prisma } from "@/lib/prisma";

/** At-risk case summary for the daily ops dashboard. */
export interface AtRiskCase {
  caseId: string;
  caseCode: string;
  title: string;
  openTaskCount: number;
  lastWorkDate: Date | null;
}

/** Shape of the daily operations snapshot. */
export interface DailyOpsSnapshot {
  generatedAt: Date;
  overdueTasks: Array<Record<string, unknown>>;
  upcomingDueCases: Array<Record<string, unknown>>;
  atRiskCases: AtRiskCase[];
  unbilled: { hours: number; amountUsd: number };
  expenseQueueUsd: number;
  outstandingInvoices: Array<Record<string, unknown>>;
  arByStatus: Record<string, number>;
}

/**
 * Build the daily operations snapshot: overdue tasks, at-risk cases,
 * unbilled time, expense queue, and A/R aging.
 */
export async function getDailyOpsSnapshot(): Promise<DailyOpsSnapshot> {
  const now = new Date();
  const in3Days = new Date(now);
  in3Days.setDate(now.getDate() + 3);
  const staleCutoff = new Date(now);
  staleCutoff.setDate(now.getDate() - 7);

  const [overdueTasks, upcomingDueCases, unbilledTime, unapprovedExpenses, outstandingInvoices, cases] =
    await Promise.all([
      prisma.task.findMany({
        where: { done: false, dueDate: { lt: now } },
        include: { case: true },
        orderBy: { dueDate: "asc" },
      }),
      prisma.case.findMany({
        where: { dueDate: { gte: now, lte: in3Days }, status: { not: "CLOSED" } },
        include: { tasks: true },
        orderBy: { dueDate: "asc" },
      }),
      prisma.timeEntry.aggregate({
        _sum: { billableAmountUsd: true, hours: true },
      }),
      prisma.expense.aggregate({
        _sum: { amountUsd: true },
        where: { status: { in: ["SUBMITTED", "APPROVED"] } },
      }),
      prisma.invoice.findMany({
        where: { status: { in: ["DRAFT", "SENT", "OVERDUE"] } },
        orderBy: { issuedDate: "asc" },
      }),
      prisma.case.findMany({
        where: { status: { not: "CLOSED" } },
        include: {
          timeEntries: { orderBy: { workDate: "desc" }, take: 1 },
          tasks: { where: { done: false } },
        },
      }),
    ]);

  const atRiskCases: AtRiskCase[] = cases
    .filter((c) => {
      const lastWork = c.timeEntries[0]?.workDate;
      const noRecentActivity = !lastWork || lastWork < staleCutoff;
      return noRecentActivity && c.tasks.length > 0;
    })
    .map((c) => ({
      caseId: c.id,
      caseCode: c.caseCode,
      title: c.title,
      openTaskCount: c.tasks.length,
      lastWorkDate: c.timeEntries[0]?.workDate ?? null,
    }));

  const arByStatus = outstandingInvoices.reduce(
    (acc, inv) => {
      acc[inv.status] = (acc[inv.status] ?? 0) + inv.amountUsd;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    generatedAt: now,
    overdueTasks: overdueTasks as unknown as Array<Record<string, unknown>>,
    upcomingDueCases: upcomingDueCases as unknown as Array<Record<string, unknown>>,
    atRiskCases,
    unbilled: {
      hours: unbilledTime._sum.hours ?? 0,
      amountUsd: unbilledTime._sum.billableAmountUsd ?? 0,
    },
    expenseQueueUsd: unapprovedExpenses._sum.amountUsd ?? 0,
    outstandingInvoices: outstandingInvoices as unknown as Array<Record<string, unknown>>,
    arByStatus,
  };
}

/** Shape of the weekly owner report. */
export interface WeeklyOwnerReport {
  generatedAt: Date;
  sevenDay: {
    revenue7: number;
    labor7: number;
    expenses7: number;
    margin7: number;
  };
  casePipeline: Array<{ status: string; _count: { _all: number } }>;
  investigatorPerformance: Array<{
    name: string;
    hours: number;
    billable: number;
    reimb: number;
    productivity: number;
  }>;
}

/**
 * Generate a 7-day owner report with revenue, margin, case pipeline,
 * and per-investigator performance metrics.
 */
export async function getWeeklyOwnerReport(): Promise<WeeklyOwnerReport> {
  const now = new Date();
  const start7 = new Date(now);
  start7.setDate(now.getDate() - 7);

  const [invoices7, time7, expenses7, caseStats, investigators] = await Promise.all([
    prisma.invoice.findMany({ where: { issuedDate: { gte: start7 } } }),
    prisma.timeEntry.findMany({
      where: { workDate: { gte: start7 } },
      include: { contractor: true },
    }),
    prisma.expense.findMany({
      where: { spentDate: { gte: start7 } },
      include: { contractor: true },
    }),
    prisma.case.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.contractor.findMany({
      include: { timeEntries: true, expenses: true },
    }),
  ]);

  const revenue7 = invoices7
    .filter((i) => i.status === "PAID" || i.status === "SENT")
    .reduce((s, i) => s + i.amountUsd, 0);
  const labor7 = time7.reduce((s, t) => s + t.billableAmountUsd, 0);
  const expenses7Total = expenses7.reduce((s, e) => s + e.amountUsd, 0);
  const margin7 = revenue7 - labor7 - expenses7Total;

  const investigatorPerformance = investigators
    .map((i) => {
      const hours = i.timeEntries.reduce((s, t) => s + t.hours, 0);
      const billable = i.timeEntries.reduce((s, t) => s + t.billableAmountUsd, 0);
      const reimb = i.expenses.reduce((s, e) => s + e.amountUsd, 0);
      const productivity = hours > 0 ? billable / hours : 0;
      return { name: i.name, hours, billable, reimb, productivity };
    })
    .sort((a, b) => b.billable - a.billable);

  return {
    generatedAt: now,
    sevenDay: { revenue7, labor7, expenses7: expenses7Total, margin7 },
    casePipeline: caseStats,
    investigatorPerformance,
  };
}
