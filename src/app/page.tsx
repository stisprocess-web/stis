/**
 * @module app/page
 * Main dashboard — KPIs, priority cases, upcoming tasks, and recent billing.
 */

import { Nav } from "@/components/nav";
import { StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData().catch(() => null);

  if (!data) {
    return (
      <div>
        <PageHeader title="Leaird PI CaseFlow" description="Business command center for cases, evidence, operations, and billing." />
        <Nav />
        <EmptyState title="Database unavailable" description="Could not connect to the database. Check your configuration." />
      </div>
    );
  }

  const { kpis, cases, tasks, invoices } = data;

  return (
    <div>
      <PageHeader title="Leaird PI CaseFlow" description="Business command center for cases, evidence, operations, and billing." />
      <Nav />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Cases" value={String(kpis.activeCases)} />
        <StatCard label="Open Tasks" value={String(kpis.openTasks)} />
        <StatCard label="Evidence Logged" value={String(kpis.evidenceCount)} />
        <StatCard label="Outstanding Invoices" value={`$${kpis.unpaidInvoices.toLocaleString()}`} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900">
          <h2 className="mb-3 text-lg font-semibold">Priority Cases</h2>
          {cases.length === 0 ? (
            <EmptyState title="No cases yet" description="Create your first case to get started." />
          ) : (
            <div className="space-y-3">
              {cases.map((c) => (
                <article key={c.id} className="rounded-lg border border-black/10 p-3 dark:border-white/15">
                  <p className="text-sm font-medium">
                    {c.caseCode} — {c.title}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {c.client.company} • {c.status} • {c.priority}
                    {c.dueDate ? ` • Due ${c.dueDate.toISOString().slice(0, 10)}` : ""}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900">
            <h2 className="mb-3 text-lg font-semibold">Upcoming Tasks</h2>
            {tasks.length === 0 ? (
              <EmptyState title="No open tasks" />
            ) : (
              <ul className="space-y-2 text-sm">
                {tasks.map((t) => (
                  <li key={t.id} className="rounded-lg border border-black/10 p-3 dark:border-white/15">
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-zinc-500">
                      {t.case.caseCode} • {t.owner}
                      {t.dueDate ? ` • Due ${t.dueDate.toISOString().slice(0, 10)}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900">
            <h2 className="mb-3 text-lg font-semibold">Recent Billing</h2>
            {invoices.length === 0 ? (
              <EmptyState title="No invoices yet" />
            ) : (
              <ul className="space-y-2 text-sm">
                {invoices.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between rounded-lg border border-black/10 p-3 dark:border-white/15">
                    <div>
                      <p className="font-medium">{inv.invoiceCode}</p>
                      <p className="text-xs text-zinc-500">{inv.client.company}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${inv.amountUsd.toLocaleString()}</p>
                      <p className="text-xs text-zinc-500">{inv.status}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
