/**
 * @module app/invoicing/page
 * Invoicing page — invoice table, time billing, and expense reimbursements.
 */

import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { getInvoicingData } from "@/lib/data";

export const dynamic = "force-dynamic";

/** Invoice status badge color. */
function invoiceStatusColor(status: string): string {
  switch (status) {
    case "PAID": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "SENT": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "OVERDUE": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    default: return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  }
}

export default async function InvoicingPage() {
  const data = await getInvoicingData().catch(() => ({ invoices: [], timeEntries: [], expenses: [] }));

  return (
    <div>
      <PageHeader title="Invoicing" description="Track billables, invoice statuses, and payment flow." />
      <Nav />

      {data.invoices.length === 0 ? (
        <EmptyState title="No invoices" description="Invoices will appear here once created." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-sm dark:border-white/15 dark:bg-zinc-900">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-100/70 dark:bg-zinc-800/70">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium">Invoice</th>
                <th className="px-3 py-2.5 text-left font-medium">Client</th>
                <th className="px-3 py-2.5 text-left font-medium">Case</th>
                <th className="px-3 py-2.5 text-left font-medium">Amount</th>
                <th className="px-3 py-2.5 text-left font-medium">Status</th>
                <th className="px-3 py-2.5 text-left font-medium">Issued</th>
              </tr>
            </thead>
            <tbody>
              {data.invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-black/5 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                  <td className="px-3 py-2.5 font-medium">{inv.invoiceCode}</td>
                  <td className="px-3 py-2.5">{inv.client.company}</td>
                  <td className="px-3 py-2.5">{inv.case.caseCode}</td>
                  <td className="px-3 py-2.5">${inv.amountUsd.toLocaleString()}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${invoiceStatusColor(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">{inv.issuedDate.toISOString().slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900">
          <h2 className="mb-3 text-lg font-semibold">1099 Time Billing</h2>
          {data.timeEntries.length === 0 ? (
            <EmptyState title="No time entries" />
          ) : (
            <ul className="space-y-2 text-sm">
              {data.timeEntries.map((t) => (
                <li key={t.id} className="rounded-lg border border-black/10 p-3 dark:border-white/15">
                  <p className="font-medium">{t.contractor.name} • {t.hours}h</p>
                  <p className="text-xs text-zinc-500">
                    {t.case.caseCode} • {t.workDate.toISOString().slice(0, 10)} • ${t.billableAmountUsd.toLocaleString()}
                  </p>
                  {t.notes && <p className="text-xs text-zinc-500">{t.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900">
          <h2 className="mb-3 text-lg font-semibold">1099 Expense Reimbursements</h2>
          {data.expenses.length === 0 ? (
            <EmptyState title="No expenses" />
          ) : (
            <ul className="space-y-2 text-sm">
              {data.expenses.map((e) => (
                <li key={e.id} className="rounded-lg border border-black/10 p-3 dark:border-white/15">
                  <p className="font-medium">{e.contractor.name} • ${e.amountUsd.toLocaleString()}</p>
                  <p className="text-xs text-zinc-500">
                    {e.category} • {e.case.caseCode} • {e.spentDate.toISOString().slice(0, 10)}
                  </p>
                  <p className="text-xs text-zinc-500">Status: {e.status}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
