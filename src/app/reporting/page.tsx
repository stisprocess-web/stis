/**
 * @module app/reporting/page
 * Reporting & analytics dashboard — case load, financials, and top contractors.
 */

import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { getAnalyticsOverview, type AnalyticsOverview } from "@/lib/analytics";

export const dynamic = "force-dynamic";

const linkBtnClass =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm shadow-sm transition hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-900 dark:hover:bg-zinc-800";

/** Default empty analytics data for error fallback. */
const emptyData: AnalyticsOverview = {
  activeCases: 0,
  totalCases: 0,
  openTasks: 0,
  totalEvidence: 0,
  unpaidInvoicesUsd: 0,
  last30Days: { billableHours: 0, billableAmountUsd: 0, expensesUsd: 0 },
  topByBillables: [],
};

export default async function ReportingPage() {
  const data = await getAnalyticsOverview().catch(() => emptyData);

  return (
    <div>
      <PageHeader title="Reporting & Analytics" description="Operational and financial visibility across cases and investigators." />
      <Nav />

      <div className="mb-6 flex flex-wrap gap-2">
        <a href="/reporting/payouts" className={linkBtnClass}>Monthly Payout Dashboard</a>
        <a href="/reporting/investigator-margins" className={linkBtnClass}>Investigator Margins</a>
        <a href="/api/analytics/profitability" className={linkBtnClass}>Case Profitability JSON</a>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Case Load</p>
          <p className="mt-2 text-2xl font-semibold">{data.activeCases} / {data.totalCases}</p>
          <p className="text-xs text-zinc-500">Active / Total</p>
        </article>
        <article className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Open Tasks</p>
          <p className="mt-2 text-2xl font-semibold">{data.openTasks}</p>
          <p className="text-xs text-zinc-500">Pending operational actions</p>
        </article>
        <article className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Outstanding A/R</p>
          <p className="mt-2 text-2xl font-semibold">${data.unpaidInvoicesUsd.toLocaleString()}</p>
          <p className="text-xs text-zinc-500">Draft + sent + overdue invoices</p>
        </article>
        <article className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Evidence Items</p>
          <p className="mt-2 text-2xl font-semibold">{data.totalEvidence}</p>
          <p className="text-xs text-zinc-500">Chain-of-custody tracked</p>
        </article>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900">
          <h2 className="mb-3 text-lg font-semibold">Last 30 Days</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>Billable Hours</span><strong>{data.last30Days.billableHours}</strong></li>
            <li className="flex justify-between"><span>Billable Revenue</span><strong>${data.last30Days.billableAmountUsd.toLocaleString()}</strong></li>
            <li className="flex justify-between"><span>Expenses Logged</span><strong>${data.last30Days.expensesUsd.toLocaleString()}</strong></li>
          </ul>
        </article>

        <article className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900">
          <h2 className="mb-3 text-lg font-semibold">Top 1099 by Billables</h2>
          {data.topByBillables.length === 0 ? (
            <EmptyState title="No contractor data" />
          ) : (
            <ul className="space-y-2 text-sm">
              {data.topByBillables.map((c) => (
                <li key={c.contractorCode} className="rounded-lg border border-black/10 p-3 dark:border-white/15">
                  <p className="font-medium">{c.name} ({c.contractorCode})</p>
                  <p className="text-xs text-zinc-500">Hours: {c.totalHours} • Billable: ${c.totalBillable.toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
}
