/**
 * @module app/reporting/investigator-margins/page
 * Investigator profitability — margin analysis by investigator.
 */

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/prisma";
import { Download, TrendingUp, TrendingDown, Users } from "lucide-react";

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
        contractType: c.contractType,
        labor,
        expenses,
        revenue: caseRevenue,
        margin,
        marginPct,
      };
    })
    .sort((a, b) => b.margin - a.margin);

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalLabor = rows.reduce((s, r) => s + r.labor, 0);
  const totalExpenses = rows.reduce((s, r) => s + r.expenses, 0);
  const totalMargin = totalRevenue - totalLabor - totalExpenses;
  const avgMarginPct = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

  function marginColor(pct: number): string {
    if (pct >= 40) return "text-success";
    if (pct >= 20) return "text-warning";
    return "text-error";
  }

  return (
    <div>
      <PageHeader
        title="Investigator Profitability"
        description="Margin by investigator -- revenue minus labor and expenses."
        actions={
          <a
            href="/api/exports/quickbooks-time.csv"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </a>
        }
      />

      {/* Summary Stats */}
      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          hint="From paid + sent invoices"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="Total Labor"
          value={`$${totalLabor.toLocaleString()}`}
          hint="Contractor labor costs"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Total Margin"
          value={`$${totalMargin.toLocaleString()}`}
          hint={`${avgMarginPct.toFixed(1)}% average margin`}
          icon={totalMargin >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          trend={totalMargin >= 0 ? "up" : "down"}
        />
        <StatCard
          label="Investigators"
          value={String(rows.length)}
          hint="Active contractors tracked"
          icon={<Users className="h-5 w-5" />}
        />
      </section>

      {rows.length === 0 ? (
        <EmptyState
          title="No investigator data"
          description="Add contractors and billing data to see margins."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-elevated">
                <th className="px-4 py-3 text-left font-medium text-text-secondary">
                  Investigator
                </th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Type</th>
                <th className="px-4 py-3 text-right font-medium text-text-secondary">Revenue</th>
                <th className="px-4 py-3 text-right font-medium text-text-secondary">Labor</th>
                <th className="px-4 py-3 text-right font-medium text-text-secondary">Expenses</th>
                <th className="px-4 py-3 text-right font-medium text-text-secondary">Margin</th>
                <th className="px-4 py-3 text-right font-medium text-text-secondary">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-border transition-colors hover:bg-surface-elevated/50"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-text-primary">{r.name}</span>
                    <span className="ml-1 text-text-muted">({r.contractorCode})</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.contractType} />
                  </td>
                  <td className="px-4 py-3 text-right text-text-primary">
                    ${r.revenue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary">
                    ${r.labor.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary">
                    ${r.expenses.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-text-primary">
                    ${r.margin.toLocaleString()}
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${marginColor(r.marginPct)}`}>
                    {r.marginPct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-surface-elevated">
                <td className="px-4 py-3 font-semibold text-text-primary" colSpan={2}>
                  Totals
                </td>
                <td className="px-4 py-3 text-right font-semibold text-text-primary">
                  ${totalRevenue.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-text-secondary">
                  ${totalLabor.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-text-secondary">
                  ${totalExpenses.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-bold text-text-primary">
                  ${totalMargin.toLocaleString()}
                </td>
                <td className={`px-4 py-3 text-right font-bold ${marginColor(avgMarginPct)}`}>
                  {avgMarginPct.toFixed(1)}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
