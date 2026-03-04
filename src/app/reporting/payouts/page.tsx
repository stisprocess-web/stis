/**
 * @module app/reporting/payouts/page
 * Monthly 1099 payout dashboard — review payable amounts before accounting export.
 */

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { prisma } from "@/lib/prisma";
import { Download, DollarSign, Clock, Receipt, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PayoutsPage() {
  const contractors = await prisma.contractor.findMany({
    where: { contractType: "C1099" },
    include: { timeEntries: true, expenses: true },
  });

  const rows = contractors.map((c) => {
    const monthHours = c.timeEntries.reduce((sum, t) => sum + t.hours, 0);
    const monthBillables = c.timeEntries.reduce((sum, t) => sum + t.billableAmountUsd, 0);
    const reimbursements = c.expenses.reduce((sum, e) => sum + e.amountUsd, 0);
    const payout = monthBillables + reimbursements;
    return { contractor: c, monthHours, monthBillables, reimbursements, payout };
  });

  const totalPayout = rows.reduce((s, r) => s + r.payout, 0);
  const totalHours = rows.reduce((s, r) => s + r.monthHours, 0);
  const totalLabor = rows.reduce((s, r) => s + r.monthBillables, 0);
  const totalExpenses = rows.reduce((s, r) => s + r.reimbursements, 0);

  return (
    <div>
      <PageHeader
        title="Monthly 1099 Payout Dashboard"
        description="Review payable amounts before accounting export."
        actions={
          <div className="flex gap-2">
            <a
              href="/api/exports/quickbooks-time.csv"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary"
            >
              <Download className="h-3.5 w-3.5" />
              QB Time CSV
            </a>
            <a
              href="/api/exports/quickbooks-expenses.csv"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary"
            >
              <Download className="h-3.5 w-3.5" />
              QB Expense CSV
            </a>
          </div>
        }
      />

      {/* Summary Stats */}
      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Payout"
          value={`$${totalPayout.toLocaleString()}`}
          hint="Labor + reimbursements"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          label="Total Hours"
          value={String(totalHours)}
          hint="Billable hours logged"
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          label="Total Labor"
          value={`$${totalLabor.toLocaleString()}`}
          hint="Contractor labor costs"
          icon={<Receipt className="h-5 w-5" />}
        />
        <StatCard
          label="1099 Contractors"
          value={String(rows.length)}
          hint={`$${totalExpenses.toLocaleString()} in expenses`}
          icon={<Users className="h-5 w-5" />}
        />
      </section>

      {rows.length === 0 ? (
        <EmptyState
          title="No 1099 contractors"
          description="Add contractors to see payout calculations."
        />
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <article
              key={row.contractor.id}
              className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border/80"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-text-primary">
                    {row.contractor.name}{" "}
                    <span className="text-sm font-normal text-text-muted">
                      ({row.contractor.contractorCode})
                    </span>
                  </h2>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-text-muted">{row.contractor.role}</span>
                    <StatusBadge status={row.contractor.contractType} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">Total Payout</p>
                  <p className="text-xl font-bold text-accent">
                    ${row.payout.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-surface-elevated p-3">
                  <p className="text-xs text-text-muted">Hours</p>
                  <p className="mt-1 text-lg font-semibold text-text-primary">
                    {row.monthHours}
                  </p>
                </div>
                <div className="rounded-lg bg-surface-elevated p-3">
                  <p className="text-xs text-text-muted">Labor</p>
                  <p className="mt-1 text-lg font-semibold text-text-primary">
                    ${row.monthBillables.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-surface-elevated p-3">
                  <p className="text-xs text-text-muted">Expenses</p>
                  <p className="mt-1 text-lg font-semibold text-text-primary">
                    ${row.reimbursements.toLocaleString()}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
