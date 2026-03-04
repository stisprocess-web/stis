/**
 * @module app/invoicing/page
 * Invoicing page -- server component wrapper that fetches data
 * and delegates to the interactive InvoicingClient component.
 */

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { InvoicingClient } from "@/components/invoicing-client";
import { getInvoicingData, getClients, getCases } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function InvoicingPage() {
  const [data, clients, cases] = await Promise.all([
    getInvoicingData().catch(() => ({ invoices: [], timeEntries: [], expenses: [] })),
    getClients().catch(() => []),
    getCases().catch(() => []),
  ]);

  // Serialize dates for client component (Date objects cannot cross server/client boundary)
  const serializedInvoices = data.invoices.map((inv) => ({
    id: inv.id,
    invoiceCode: inv.invoiceCode,
    amountUsd: inv.amountUsd,
    status: inv.status,
    issuedDate: inv.issuedDate ? inv.issuedDate.toISOString().slice(0, 10) : null,
    dueDate: inv.dueDate ? inv.dueDate.toISOString().slice(0, 10) : null,
    client: { id: inv.client.id, company: inv.client.company },
    case: { id: inv.case.id, caseCode: inv.case.caseCode },
  }));

  const serializedTimeEntries = data.timeEntries.map((t) => ({
    id: t.id,
    hours: t.hours,
    billableAmountUsd: t.billableAmountUsd,
    workDate: t.workDate ? t.workDate.toISOString().slice(0, 10) : null,
    notes: t.notes,
    contractor: { name: t.contractor.name },
    case: { caseCode: t.case.caseCode },
  }));

  const serializedExpenses = data.expenses.map((e) => ({
    id: e.id,
    amountUsd: e.amountUsd,
    category: e.category,
    status: e.status,
    spentDate: e.spentDate ? e.spentDate.toISOString().slice(0, 10) : null,
    notes: e.notes,
    contractor: { name: e.contractor.name },
    case: { caseCode: e.case.caseCode },
  }));

  const serializedClients = clients.map((cl) => ({
    id: cl.id,
    name: cl.name,
    company: cl.company,
  }));

  const serializedCases = cases.map((c) => ({
    id: c.id,
    caseCode: c.caseCode,
    title: c.title,
  }));

  if (
    data.invoices.length === 0 &&
    data.timeEntries.length === 0 &&
    data.expenses.length === 0 &&
    clients.length === 0
  ) {
    return (
      <div>
        <PageHeader title="Invoicing" description="Track billables, invoice statuses, and payment flow." />
        <EmptyState
          title="No invoicing data"
          description="Invoices, time entries, and expenses will appear here once created."
        />
      </div>
    );
  }

  return (
    <InvoicingClient
      invoices={serializedInvoices}
      timeEntries={serializedTimeEntries}
      expenses={serializedExpenses}
      clients={serializedClients}
      cases={serializedCases}
    />
  );
}
