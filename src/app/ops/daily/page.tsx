/**
 * @module app/ops/daily/page
 * Daily operations dashboard — overdue tasks, at-risk cases, unbilled time, A/R aging.
 */

import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { getDailyOpsSnapshot } from "@/lib/ops";

export const dynamic = "force-dynamic";

const linkBtnClass =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm shadow-sm transition hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-900 dark:hover:bg-zinc-800";

export default async function DailyOpsPage() {
  const data = await getDailyOpsSnapshot();

  return (
    <div>
      <PageHeader title="Daily Operations Dashboard" description="Action queue for owner/admin operations each morning." />
      <Nav />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Overdue Tasks" value={String(data.overdueTasks.length)} hint="Need immediate attention" />
        <StatCard label="At-Risk Cases" value={String(data.atRiskCases.length)} hint="No recent activity + open tasks" />
        <StatCard label="Unbilled Amount" value={`$${data.unbilled.amountUsd.toLocaleString()}`} hint={`${data.unbilled.hours} hours`} />
        <StatCard label="Expense Queue" value={`$${data.expenseQueueUsd.toLocaleString()}`} hint="Pending approval/reimbursement" />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900">
          <h2 className="mb-3 font-semibold">At-Risk Cases</h2>
          {data.atRiskCases.length === 0 ? (
            <EmptyState title="No at-risk cases" description="All cases have recent activity." />
          ) : (
            <ul className="space-y-2 text-sm">
              {data.atRiskCases.map((c) => (
                <li key={c.caseId} className="rounded-lg border border-black/10 p-3 dark:border-white/15">
                  <p className="font-medium">{c.caseCode} — {c.title}</p>
                  <p className="text-xs text-zinc-500">
                    Open tasks: {c.openTaskCount} • Last work:{" "}
                    {c.lastWorkDate ? new Date(c.lastWorkDate).toISOString().slice(0, 10) : "none"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900">
          <h2 className="mb-3 font-semibold">A/R Aging Snapshot</h2>
          {Object.keys(data.arByStatus).length === 0 ? (
            <EmptyState title="No outstanding invoices" />
          ) : (
            <ul className="space-y-2 text-sm">
              {Object.entries(data.arByStatus).map(([status, amount]) => (
                <li key={status} className="flex justify-between rounded-lg border border-black/10 p-3 dark:border-white/15">
                  <span>{status}</span>
                  <strong>${Number(amount).toLocaleString()}</strong>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        <a href="/api/ops/weekly-report" className={linkBtnClass}>
          Generate Weekly Owner Report (JSON + Markdown)
        </a>
      </div>
    </div>
  );
}
