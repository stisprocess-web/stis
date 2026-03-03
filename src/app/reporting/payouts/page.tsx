/**
 * @module app/reporting/payouts/page
 * Monthly 1099 payout dashboard — review payable amounts before accounting export.
 */

import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const linkBtnClass =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm shadow-sm transition hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-900 dark:hover:bg-zinc-800";

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

  return (
    <div>
      <PageHeader title="Monthly 1099 Payout Dashboard" description="Review payable amounts before accounting export." />
      <Nav />

      <div className="mb-6 flex flex-wrap gap-2">
        <a href="/api/exports/quickbooks-time.csv" className={linkBtnClass}>QuickBooks Time CSV</a>
        <a href="/api/exports/quickbooks-expenses.csv" className={linkBtnClass}>QuickBooks Expense CSV</a>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No 1099 contractors" description="Add contractors to see payout calculations." />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <article key={row.contractor.id} className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900">
              <h2 className="font-semibold">
                {row.contractor.name}{" "}
                <span className="text-sm font-normal text-zinc-500">({row.contractor.contractorCode})</span>
              </h2>
              <p className="text-xs text-zinc-500">{row.contractor.role} • {row.contractor.contractType}</p>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-xs text-zinc-500">Hours</p>
                  <p className="font-semibold">{row.monthHours}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Labor</p>
                  <p className="font-semibold">${row.monthBillables.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Expenses</p>
                  <p className="font-semibold">${row.reimbursements.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Total Payout</p>
                  <p className="text-lg font-bold">${row.payout.toLocaleString()}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
