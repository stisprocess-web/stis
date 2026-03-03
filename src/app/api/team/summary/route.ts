/**
 * @module api/team/summary
 * GET /api/team/summary — Aggregate team metrics for 1099 contractors.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [contractors, openExpenses, timeEntries, totalBillable] = await Promise.all([
      prisma.contractor.count({ where: { contractType: "C1099" } }),
      prisma.expense.aggregate({
        _sum: { amountUsd: true },
        where: { status: { not: "REIMBURSED" } },
      }),
      prisma.timeEntry.aggregate({ _sum: { hours: true } }),
      prisma.timeEntry.aggregate({ _sum: { billableAmountUsd: true } }),
    ]);

    return NextResponse.json({
      contractors1099: contractors,
      openExpenseUsd: openExpenses._sum.amountUsd ?? 0,
      billableHours: timeEntries._sum.hours ?? 0,
      billableAmountUsd: totalBillable._sum.billableAmountUsd ?? 0,
    });
  } catch (error) {
    console.error("Failed to fetch team summary:", error);
    return NextResponse.json({ error: "Failed to fetch team summary" }, { status: 500 });
  }
}
