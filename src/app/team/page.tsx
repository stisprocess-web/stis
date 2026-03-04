/**
 * @module app/team/page
 * Team & 1099 page -- server component wrapper that fetches data
 * and delegates to the interactive TeamClient component.
 */

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { TeamClient } from "@/components/team-client";
import { prisma } from "@/lib/prisma";
import type { Contractor, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type TimeEntryWithRelations = Prisma.TimeEntryGetPayload<{
  include: { contractor: true; case: true };
}>;

type ExpenseWithRelations = Prisma.ExpenseGetPayload<{
  include: { contractor: true; case: true };
}>;

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
    /* Database not available -- show empty state */
  }

  // Serialize dates for client component (Date objects cannot cross server/client boundary)
  const serializedContractors = contractors.map((c) => ({
    id: c.id,
    contractorCode: c.contractorCode,
    name: c.name,
    role: c.role,
    contractType: c.contractType,
    hourlyRateUsd: c.hourlyRateUsd,
  }));

  const serializedTimeEntries = timeEntries.map((t) => ({
    id: t.id,
    hours: t.hours,
    billableAmountUsd: t.billableAmountUsd,
    workDate: t.workDate ? t.workDate.toISOString().slice(0, 10) : null,
    notes: t.notes,
    contractor: { name: t.contractor.name },
    case: { caseCode: t.case.caseCode },
  }));

  const serializedExpenses = expenses.map((e) => ({
    id: e.id,
    amountUsd: e.amountUsd,
    category: e.category,
    status: e.status,
    spentDate: e.spentDate ? e.spentDate.toISOString().slice(0, 10) : null,
    notes: e.notes,
    contractor: { name: e.contractor.name },
    case: { caseCode: e.case.caseCode },
  }));

  if (contractors.length === 0 && timeEntries.length === 0 && expenses.length === 0) {
    return (
      <div>
        <PageHeader title="Team & 1099" description="Manage contractor hours, rates, and reimbursement workflow." />
        <EmptyState
          title="No team data"
          description="Add 1099 contractors to the database to get started."
        />
      </div>
    );
  }

  return (
    <TeamClient
      contractors={serializedContractors}
      timeEntries={serializedTimeEntries}
      expenses={serializedExpenses}
    />
  );
}
