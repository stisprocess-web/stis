"use client";

/**
 * @module components/team-client
 * Interactive team & 1099 page with contractor cards, time entries,
 * expense queue, and entry forms.
 */

import {
  Users,
  Clock,
  Receipt,
  Download,
  FileJson,
  Briefcase,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { TeamEntryForms } from "@/components/team-entry-forms";

/* ── Types ──────────────────────────────────────────────────────────── */

interface SerializedContractor {
  id: string;
  contractorCode: string;
  name: string;
  role: string;
  contractType: string;
  hourlyRateUsd: number;
}

interface SerializedTimeEntry {
  id: string;
  hours: number;
  billableAmountUsd: number;
  workDate: string | null;
  notes: string | null;
  contractor: { name: string };
  case: { caseCode: string };
}

interface SerializedExpense {
  id: string;
  amountUsd: number;
  category: string;
  status: string;
  spentDate: string | null;
  notes: string | null;
  contractor: { name: string };
  case: { caseCode: string };
}

interface TeamClientProps {
  contractors: SerializedContractor[];
  timeEntries: SerializedTimeEntry[];
  expenses: SerializedExpense[];
}

/* ── Component ──────────────────────────────────────────────────────── */

export function TeamClient({
  contractors,
  timeEntries,
  expenses,
}: TeamClientProps) {
  return (
    <div>
      <PageHeader
        title="Team & 1099"
        description="Manage contractor hours, rates, and reimbursement workflow."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/api/exports/time-entries.csv"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary"
            >
              <Download className="h-3.5 w-3.5" />
              Time CSV
            </a>
            <a
              href="/api/exports/expenses.csv"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary"
            >
              <Download className="h-3.5 w-3.5" />
              Expenses CSV
            </a>
            <a
              href="/api/exports/1099-summary"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary"
            >
              <FileJson className="h-3.5 w-3.5" />
              1099 JSON
            </a>
          </div>
        }
      />

      {/* Contractor Cards Grid */}
      {contractors.length === 0 ? (
        <EmptyState
          title="No contractors found"
          description="Add 1099 contractors to the database to get started."
        />
      ) : (
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contractors.map((c) => (
            <article
              key={c.id}
              className="group rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/30"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15">
                  <Briefcase className="h-5 w-5 text-accent" />
                </div>
                <StatusBadge status={c.contractType} />
              </div>
              <p className="text-xs text-text-muted">{c.contractorCode}</p>
              <h3 className="mt-1 text-base font-semibold text-text-primary">{c.name}</h3>
              <p className="mt-0.5 text-sm text-text-secondary">{c.role}</p>
              <div className="mt-3 flex items-center gap-1 border-t border-border pt-3">
                <Users className="h-4 w-4 text-text-muted" />
                <span className="text-sm font-medium text-text-primary">${c.hourlyRateUsd}</span>
                <span className="text-sm text-text-muted">/hr</span>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Time Entries Table */}
      <section className="mb-6 rounded-xl border border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Clock className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-text-primary">Time Entries</h2>
        </div>
        {timeEntries.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No time entries" description="Time entries will appear here once logged." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-surface-elevated">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Contractor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Case</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Hours</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Billable</th>
                </tr>
              </thead>
              <tbody>
                {timeEntries.map((t) => (
                  <tr
                    key={t.id}
                    className="border-t border-border transition-colors hover:bg-surface-elevated/50"
                  >
                    <td className="px-4 py-3 text-text-muted">{t.workDate || "\u2014"}</td>
                    <td className="px-4 py-3 text-text-primary">{t.contractor.name}</td>
                    <td className="px-4 py-3 text-text-secondary">{t.case.caseCode}</td>
                    <td className="px-4 py-3 text-text-secondary">{t.hours}h</td>
                    <td className="px-4 py-3 font-medium text-text-primary">${t.billableAmountUsd.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Expense Queue Table */}
      <section className="mb-6 rounded-xl border border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Receipt className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-text-primary">Expense Queue</h2>
        </div>
        {expenses.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No expenses" description="Expenses will appear here once submitted." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-surface-elevated">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Contractor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Case</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Status</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr
                    key={e.id}
                    className="border-t border-border transition-colors hover:bg-surface-elevated/50"
                  >
                    <td className="px-4 py-3 text-text-muted">{e.spentDate || "\u2014"}</td>
                    <td className="px-4 py-3 text-text-primary">{e.contractor.name}</td>
                    <td className="px-4 py-3 text-text-secondary">{e.case.caseCode}</td>
                    <td className="px-4 py-3 text-text-secondary">{e.category}</td>
                    <td className="px-4 py-3 font-medium text-text-primary">${e.amountUsd.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={e.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Entry Forms */}
      <TeamEntryForms />
    </div>
  );
}
