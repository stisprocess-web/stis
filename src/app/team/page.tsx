/**
 * @module app/team/page
 * Team & 1099 management — contractor profiles, time entries, and expense queue.
 */

import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { TeamEntryForms } from "@/components/team-entry-forms";
import { prisma } from "@/lib/prisma";
import type { Contractor, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type TimeEntryWithRelations = Prisma.TimeEntryGetPayload<{
  include: { contractor: true; case: true };
}>;

type ExpenseWithRelations = Prisma.ExpenseGetPayload<{
  include: { contractor: true; case: true };
}>;

/** Link button styling for export actions. */
const linkBtnClass =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm shadow-sm transition hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-900 dark:hover:bg-zinc-800";

export default async function TeamPage() {
  let contractors: Contractor[] = [];
  let timeEntries: TimeEntryWithRelations[] = [];
  let expenses: ExpenseWithRelations[] = [];

  try {
    [contractors, timeEntries, expenses] = await Promise.all([
      prisma.contractor.findMany({ where: { contractType: "C1099" }, orderBy: { name: "asc" } }),
      prisma.timeEntry.findMany({
        include: { contractor: true, case: true },
        orderBy: { workDate: "desc" },
        take: 20,
      }),
      prisma.expense.findMany({
        include: { contractor: true, case: true },
        orderBy: { spentDate: "desc" },
        take: 20,
      }),
    ]);
  } catch {
    /* Database not available — show empty state */
  }

  const openExpenses = expenses.filter((e) => e.status !== "REIMBURSED");

  return (
    <div>
      <PageHeader title="Team & 1099 Management" description="Manage contractor hours, rates, and reimbursement workflow." />
      <Nav />

      <div className="mb-6 flex flex-wrap gap-2">
        <a href="/api/exports/time-entries.csv" className={linkBtnClass}>Export Time CSV</a>
        <a href="/api/exports/expenses.csv" className={linkBtnClass}>Export Expenses CSV</a>
        <a href="/api/exports/1099-summary" className={linkBtnClass}>1099 Summary JSON</a>
      </div>

      {contractors.length === 0 ? (
        <EmptyState title="No contractors found" description="Add 1099 contractors to the database to get started." />
      ) : (
        <section className="mb-6 grid gap-3 md:grid-cols-3">
          {contractors.map((c) => (
            <article key={c.id} className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900">
              <p className="text-xs text-zinc-500">{c.contractorCode}</p>
              <h2 className="font-semibold">{c.name}</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{c.role}</p>
              <p className="mt-2 text-sm">
                {c.contractType} • ${c.hourlyRateUsd}/hr
              </p>
            </article>
          ))}
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900">
          <h2 className="mb-3 text-lg font-semibold">Time Entries</h2>
          {timeEntries.length === 0 ? (
            <EmptyState title="No time entries" />
          ) : (
            <ul className="space-y-2 text-sm">
              {timeEntries.map((entry) => (
                <li key={entry.id} className="rounded-lg border border-black/10 p-3 dark:border-white/15">
                  <p className="font-medium">{entry.contractor.name} — {entry.hours}h</p>
                  <p className="text-xs text-zinc-500">
                    Case {entry.case.caseCode} • {entry.workDate.toISOString().slice(0, 10)} • ${entry.billableAmountUsd.toLocaleString()}
                  </p>
                  {entry.notes && <p className="text-xs text-zinc-500">{entry.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900">
          <h2 className="mb-3 text-lg font-semibold">Expense Queue</h2>
          {openExpenses.length === 0 ? (
            <EmptyState title="No pending expenses" />
          ) : (
            <ul className="space-y-2 text-sm">
              {openExpenses.map((exp) => (
                <li key={exp.id} className="rounded-lg border border-black/10 p-3 dark:border-white/15">
                  <p className="font-medium">{exp.contractor.name} — ${exp.amountUsd.toLocaleString()}</p>
                  <p className="text-xs text-zinc-500">
                    {exp.category} • {exp.case.caseCode} • {exp.spentDate.toISOString().slice(0, 10)}
                  </p>
                  <p className="text-xs text-zinc-500">Status: {exp.status}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <TeamEntryForms />
    </div>
  );
}
