/**
 * @module api/analytics/profitability
 * GET /api/analytics/profitability — Case-level profitability analysis.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cases = await prisma.case.findMany({
      include: {
        invoices: true,
        timeEntries: true,
        expenses: true,
        client: true,
      },
    });

    const rows = cases
      .map((c) => {
        const revenue = c.invoices
          .filter((i) => i.status === "PAID" || i.status === "SENT")
          .reduce((sum, i) => sum + i.amountUsd, 0);
        const labor = c.timeEntries.reduce((sum, t) => sum + t.billableAmountUsd, 0);
        const expenses = c.expenses.reduce((sum, e) => sum + e.amountUsd, 0);
        const margin = revenue - labor - expenses;
        const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0;

        return {
          caseId: c.id,
          caseCode: c.caseCode,
          title: c.title,
          client: c.client.company,
          revenue,
          labor,
          expenses,
          margin,
          marginPct: Math.round(marginPct * 10) / 10,
        };
      })
      .sort((a, b) => b.margin - a.margin);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to compute profitability:", error);
    return NextResponse.json({ error: "Failed to compute profitability" }, { status: 500 });
  }
}
