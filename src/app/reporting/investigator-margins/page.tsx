/**
 * @module app/reporting/investigator-margins/page
 * Investigator profitability — margin analysis by investigator.
 */

import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function InvestigatorMarginsPage() {
  const contractors = await prisma.contractor.findMany({
    include: {
      timeEntries: { include: { case: { include: { invoices: true } } } },
      expenses: true,
    },
  });

  const rows = contractors
    .map((c) => {
      const labor = c.timeEntries.reduce((s, t) => s + t.billableAmountUsd, 0);
      const expenses = c.expenses.reduce((s, e) => s + e.amountUsd, 0);

      // Attribute revenue proportionally to case involvement
      const caseRevenue = c.timeEntries.reduce((sum, t) => {
        const revenue = t.case.invoices
          .filter((i) => i.status === "PAID" || i.status === "SENT")
          .reduce((s, i) => s + i.amountUsd, 0);
        return sum + revenue;
      }, 0);

      const margin = caseRevenue - labor - expenses;
      const marginPct = caseRevenue > 0 ? (margin / caseRevenue) * 100 : 0;

      return {
        id: c.id,
        name: c.name,
        contractorCode: c.contractorCode,
        labor,
        expenses,
        revenue: caseRevenue,
        margin,
        marginPct,
      };
    })
    .sort((a, b) => b.margin - a.margin);

  /** Margin color coding. */
  function marginColor(pct: number): string {
    if (pct >= 40) return "text-emerald-600 dark:text-emerald-400";
    if (pct >= 20) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  }

  return (
    <div>
      <PageHeader title="Investigator Profitability" description="Margin by investigator — revenue minus labor and expenses." />
      <Nav />

      {rows.length === 0 ? (
        <EmptyState title="No investigator data" description="Add contractors and billing data to see margins." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-sm dark:border-white/15 dark:bg-zinc-900">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-100/70 dark:bg-zinc-800/70">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium">Investigator</th>
                <th className="px-3 py-2.5 text-right font-medium">Revenue</th>
                <th className="px-3 py-2.5 text-right font-medium">Labor</th>
                <th className="px-3 py-2.5 text-right font-medium">Expenses</th>
                <th className="px-3 py-2.5 text-right font-medium">Margin</th>
                <th className="px-3 py-2.5 text-right font-medium">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-black/5 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                  <td className="px-3 py-2.5 font-medium">{r.name} ({r.contractorCode})</td>
                  <td className="px-3 py-2.5 text-right">${r.revenue.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right">${r.labor.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right">${r.expenses.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right font-medium">${r.margin.toLocaleString()}</td>
                  <td className={`px-3 py-2.5 text-right font-semibold ${marginColor(r.marginPct)}`}>
                    {r.marginPct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
