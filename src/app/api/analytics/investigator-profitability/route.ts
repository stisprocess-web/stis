/**
 * @module api/analytics/investigator-profitability
 * GET /api/analytics/investigator-profitability — Per-investigator margin analysis.
 *
 * Revenue is attributed proportionally based on each investigator's share
 * of total cost (labor + expenses) on each case.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Aggregated margin data for a single investigator. */
interface InvestigatorMargin {
  investigator: string;
  revenue: number;
  labor: number;
  expenses: number;
  margin: number;
  caseCount: number;
}

export async function GET() {
  try {
    const cases = await prisma.case.findMany({
      include: {
        invoices: true,
        timeEntries: { include: { contractor: true } },
        expenses: { include: { contractor: true } },
      },
    });

    const byInvestigator = new Map<string, InvestigatorMargin>();

    for (const c of cases) {
      const revenue = c.invoices
        .filter((i) => i.status === "PAID" || i.status === "SENT")
        .reduce((s, i) => s + i.amountUsd, 0);

      // Group costs by investigator name
      const groups = new Map<string, { labor: number; expenses: number }>();

      for (const t of c.timeEntries) {
        const name = t.contractor.name;
        const g = groups.get(name) ?? { labor: 0, expenses: 0 };
        g.labor += t.billableAmountUsd;
        groups.set(name, g);
      }

      for (const e of c.expenses) {
        const name = e.contractor.name;
        const g = groups.get(name) ?? { labor: 0, expenses: 0 };
        g.expenses += e.amountUsd;
        groups.set(name, g);
      }

      const totalCost = [...groups.values()].reduce((s, g) => s + g.labor + g.expenses, 0);

      // Attribute revenue proportionally to each investigator's cost share
      for (const [investigator, g] of groups.entries()) {
        const share = totalCost > 0 ? (g.labor + g.expenses) / totalCost : 0;
        const attributedRevenue = revenue * share;
        const margin = attributedRevenue - g.labor - g.expenses;

        const row = byInvestigator.get(investigator) ?? {
          investigator,
          revenue: 0,
          labor: 0,
          expenses: 0,
          margin: 0,
          caseCount: 0,
        };

        row.revenue += attributedRevenue;
        row.labor += g.labor;
        row.expenses += g.expenses;
        row.margin += margin;
        row.caseCount += 1;
        byInvestigator.set(investigator, row);
      }

      // Cases with no time/expense entries — attribute to case investigator
      if (groups.size === 0) {
        const owner = c.investigator || "Unassigned";
        const row = byInvestigator.get(owner) ?? {
          investigator: owner,
          revenue: 0,
          labor: 0,
          expenses: 0,
          margin: 0,
          caseCount: 0,
        };
        row.revenue += revenue;
        row.margin += revenue;
        row.caseCount += 1;
        byInvestigator.set(owner, row);
      }
    }

    const rows = [...byInvestigator.values()]
      .map((r) => ({
        ...r,
        marginPct: r.revenue > 0 ? Math.round((r.margin / r.revenue) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.margin - a.margin);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to compute investigator profitability:", error);
    return NextResponse.json({ error: "Failed to compute investigator profitability" }, { status: 500 });
  }
}
