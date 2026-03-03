/**
 * @module app/settings/page
 * Business settings — roles, compliance, and configuration overview.
 */

import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Business Settings" description="Role permissions, templates, compliance defaults, and integrations." />
      <Nav />

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-zinc-900">
          <h2 className="mb-3 font-semibold">Access Roles</h2>
          <ul className="space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
            <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500" /> Owner / Admin — full access</li>
            <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500" /> Lead Investigator — cases, evidence, time</li>
            <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" /> Investigator — assigned cases and time entry</li>
            <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Billing — invoicing, reporting, expenses</li>
            <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-zinc-400" /> Client Portal — read-only case status</li>
          </ul>
        </section>

        <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-zinc-900">
          <h2 className="mb-3 font-semibold">Compliance Requirements</h2>
          <ul className="space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
            <li>✓ Chain-of-custody required on all evidence uploads</li>
            <li>✓ Activity log retained for 7 years</li>
            <li>✓ Signed report PDF export with watermark</li>
            <li>✓ Audit trail on status, billing, and file access</li>
            <li>✓ Contract PDFs generated and stored locally</li>
          </ul>
        </section>

        <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-zinc-900">
          <h2 className="mb-3 font-semibold">Contract Generation</h2>
          <ul className="space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
            <li>✓ PDF generated locally using pdf-lib</li>
            <li>✓ Signature lines and initial blocks included</li>
            <li>✓ Status tracking: draft → sent → signed</li>
            <li>✓ Signed copies stored in case files</li>
            <li>✓ Email queue for client + office copies</li>
          </ul>
        </section>

        <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-zinc-900">
          <h2 className="mb-3 font-semibold">Export Integrations</h2>
          <ul className="space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
            <li>✓ QuickBooks time activities CSV</li>
            <li>✓ QuickBooks expenses CSV</li>
            <li>✓ 1099 contractor summary (JSON)</li>
            <li>✓ Time entries CSV</li>
            <li>✓ Expenses CSV</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
