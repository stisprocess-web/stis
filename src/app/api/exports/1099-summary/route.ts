/**
 * @module api/exports/1099-summary
 * GET /api/exports/1099-summary — 1099 contractor compensation summary (JSON).
 *
 * Accepts optional `month` query param (YYYY-MM format).
 * Returns per-contractor monthly and YTD compensation breakdowns.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const monthParam = req.nextUrl.searchParams.get("month"); // YYYY-MM
    const now = new Date();
    const year = monthParam ? Number(monthParam.split("-")[0]) : now.getFullYear();
    const monthIdx = monthParam ? Number(monthParam.split("-")[1]) - 1 : now.getMonth();

    if (isNaN(year) || isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) {
      return NextResponse.json({ error: "Invalid month format. Use YYYY-MM." }, { status: 400 });
    }

    const monthStart = new Date(Date.UTC(year, monthIdx, 1));
    const monthEnd = new Date(Date.UTC(year, monthIdx + 1, 1));
    const ytdStart = new Date(Date.UTC(year, 0, 1));

    const contractors = await prisma.contractor.findMany({
      where: { contractType: "C1099" },
      include: { timeEntries: true, expenses: true },
    });

    const summary = contractors.map((c) => {
      const monthEntries = c.timeEntries.filter((t) => t.workDate >= monthStart && t.workDate < monthEnd);
      const ytdEntries = c.timeEntries.filter((t) => t.workDate >= ytdStart);
      const ytdExpenses = c.expenses.filter((e) => e.spentDate >= ytdStart);

      const monthHours = monthEntries.reduce((sum, t) => sum + t.hours, 0);
      const monthBillables = monthEntries.reduce((sum, t) => sum + t.billableAmountUsd, 0);
      const ytdBillables = ytdEntries.reduce((sum, t) => sum + t.billableAmountUsd, 0);
      const ytdReimbursements = ytdExpenses.reduce((sum, e) => sum + e.amountUsd, 0);

      return {
        contractorId: c.id,
        contractorCode: c.contractorCode,
        name: c.name,
        monthHours,
        monthBillables,
        ytdBillables,
        ytdReimbursements,
        ytdTotalComp: ytdBillables + ytdReimbursements,
      };
    });

    return NextResponse.json({
      month: `${year}-${String(monthIdx + 1).padStart(2, "0")}`,
      summary,
    });
  } catch (error) {
    console.error("Failed to generate 1099 summary:", error);
    return NextResponse.json({ error: "Failed to generate 1099 summary" }, { status: 500 });
  }
}
