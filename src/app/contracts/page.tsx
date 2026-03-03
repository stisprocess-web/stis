/**
 * @module app/contracts/page
 * Contracts page — create, generate PDF, track signature status, and email copies.
 *
 * All contract workflows use local PDF generation (pdf-lib). No third-party
 * signature services (DocuSign, Dropbox Sign, etc.) are used.
 */

import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { listContracts } from "@/lib/contracts";

export const dynamic = "force-dynamic";

/** Status badge color for contracts. */
function statusBadge(status: string): string {
  switch (status) {
    case "signed": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "sent": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    default: return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  }
}

const inputClass =
  "rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-400";

const buttonClass =
  "mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200";

export default async function ContractsPage() {
  const contracts = await listContracts();

  return (
    <div>
      <PageHeader
        title="Contracts"
        description="Create contract PDFs with signature blocks, track signing status, store signed copies, and email completions — all locally generated."
      />
      <Nav />

      <section className="grid gap-4 lg:grid-cols-2">
        {/* Create Contract + Generate PDF */}
        <form
          action="/api/contracts/create"
          method="post"
          className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-zinc-900"
        >
          <h2 className="mb-4 text-lg font-semibold">Create Contract & Generate PDF</h2>
          <div className="grid gap-3">
            <input name="caseCode" placeholder="Case code (e.g. C-1001)" className={inputClass} required />
            <input name="clientName" placeholder="Client full name" className={inputClass} required />
            <input name="clientEmail" type="email" placeholder="Client email" className={inputClass} required />
            <input name="templateName" placeholder="Template name (e.g. Standard Investigation)" className={inputClass} required />
            <input name="scopeOfWork" placeholder="Scope of work (optional — uses default)" className={inputClass} />
            <input name="retainerAmount" placeholder="Retainer amount (e.g. 5,000.00)" className={inputClass} />
            <input name="hourlyRate" placeholder="Hourly rate (e.g. 125.00)" className={inputClass} />
          </div>
          <button type="submit" className={buttonClass}>Create Contract & Generate PDF</button>
        </form>

        {/* Send for Signature (local tracking) */}
        <form
          action="/api/contracts/send"
          method="post"
          className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-zinc-900"
        >
          <h2 className="mb-4 text-lg font-semibold">Send for Signature</h2>
          <p className="mb-3 text-xs text-zinc-500">
            Mark a contract as sent — the generated PDF can be printed, emailed, or delivered for wet signature.
          </p>
          <div className="grid gap-3">
            <input name="contractId" placeholder="Contract ID (e.g. CTR-...)" className={inputClass} required />
          </div>
          <button type="submit" className={buttonClass}>Mark as Sent</button>
        </form>
      </section>

      {/* Mark Signed */}
      <form
        action="/api/contracts/mark-signed"
        method="post"
        className="mt-4 rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-zinc-900"
      >
        <h2 className="mb-4 text-lg font-semibold">Mark Signed & Email Copies</h2>
        <p className="mb-3 text-xs text-zinc-500">
          Upload the signed copy, mark the contract as signed, and queue email notifications to the client and office.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <input name="contractId" placeholder="Contract ID" className={inputClass} required />
          <input name="officeEmail" type="email" placeholder="Office email for copy" className={inputClass} required />
        </div>
        <button type="submit" className={buttonClass}>Mark Signed & Queue Emails</button>
      </form>

      {/* Contract Queue */}
      <section className="mt-6 rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900">
        <h2 className="mb-3 text-lg font-semibold">Contract Queue</h2>
        {contracts.length === 0 ? (
          <EmptyState title="No contracts" description="Create your first contract above." />
        ) : (
          <div className="space-y-2">
            {contracts.map((c) => (
              <article key={c.id} className="flex items-center justify-between rounded-lg border border-black/10 p-3 dark:border-white/15">
                <div>
                  <p className="text-sm font-medium">{c.id} • {c.caseCode}</p>
                  <p className="text-xs text-zinc-500">
                    {c.clientName} • {c.clientEmail} • {c.templateName}
                  </p>
                  {c.pdfPath && (
                    <p className="text-xs text-zinc-500">PDF: {c.pdfPath}</p>
                  )}
                  {c.signedAt && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      Signed: {new Date(c.signedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(c.status)}`}>
                  {c.status}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
