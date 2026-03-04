/**
 * @module app/page
 * Main dashboard -- KPIs, quick actions, priority cases, upcoming tasks, and recent billing.
 */

import Link from "next/link";
import { Briefcase, CheckSquare, FileText, Plus, Calendar, DollarSign } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData().catch(() => null);

  if (!data) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Business command center" />
        <EmptyState
          title="Database unavailable"
          description="Could not connect to the database. Check your configuration."
        />
      </div>
    );
  }

  const { kpis, cases, tasks, invoices } = data;

  return (
    <div>
      <PageHeader title="Dashboard" description="Business command center" />

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Cases"
          value={String(kpis.activeCases)}
          icon={<Briefcase className="h-5 w-5" />}
        />
        <StatCard
          label="Open Tasks"
          value={String(kpis.openTasks)}
          icon={<CheckSquare className="h-5 w-5" />}
        />
        <StatCard
          label="Evidence Logged"
          value={String(kpis.evidenceCount)}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          label="Outstanding Invoices"
          value={`$${kpis.unpaidInvoices.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
        />
      </section>

      {/* Quick Actions */}
      <section className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/cases"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" />
          New Case
        </Link>
        <Link
          href="/tasks"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-text-muted"
        >
          <Plus className="h-4 w-4" />
          New Task
        </Link>
        <Link
          href="/invoicing"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-text-muted"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </Link>
      </section>

      {/* Priority Cases */}
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Priority Cases</h2>
        {cases.length === 0 ? (
          <EmptyState
            title="No cases yet"
            description="Create your first case to get started."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => (
              <article
                key={c.id}
                className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-text-muted"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-accent">{c.caseCode}</p>
                  <StatusBadge status={c.priority} />
                </div>
                <p className="mt-1.5 text-sm font-medium text-text-primary">{c.title}</p>
                <p className="mt-1 text-xs text-text-secondary">{c.client.company}</p>
                <div className="mt-3 flex items-center justify-between">
                  <StatusBadge status={c.status} />
                  {c.dueDate && (
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <Calendar className="h-3 w-3" />
                      {c.dueDate.toISOString().slice(0, 10)}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Two-column: Upcoming Tasks + Recent Billing */}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Upcoming Tasks */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Upcoming Tasks</h2>
          {tasks.length === 0 ? (
            <EmptyState title="No open tasks" />
          ) : (
            <ul className="space-y-3">
              {tasks.map((t) => (
                <li
                  key={t.id}
                  className="rounded-lg border border-border bg-background p-3 transition-colors hover:border-text-muted"
                >
                  <p className="text-sm font-medium text-text-primary">{t.title}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-text-muted">
                    <span className="text-accent">{t.case.caseCode}</span>
                    <span>|</span>
                    <span>{t.owner}</span>
                    {t.dueDate && (
                      <>
                        <span>|</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {t.dueDate.toISOString().slice(0, 10)}
                        </span>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Billing */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Recent Billing</h2>
          {invoices.length === 0 ? (
            <EmptyState title="No invoices yet" />
          ) : (
            <ul className="space-y-3">
              {invoices.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-3 transition-colors hover:border-text-muted"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{inv.invoiceCode}</p>
                    <p className="mt-0.5 text-xs text-text-muted">{inv.client.company}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text-primary">
                      ${inv.amountUsd.toLocaleString()}
                    </p>
                    <StatusBadge status={inv.status} className="mt-1" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
