/**
 * @module app/cases/page
 * Cases list page — tabular view of all investigations.
 */

import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { getCases } from "@/lib/data";

export const dynamic = "force-dynamic";

/** Priority badge color mapping. */
function priorityColor(p: string): string {
  switch (p) {
    case "URGENT": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    case "HIGH": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
    case "MEDIUM": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    default: return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  }
}

/** Status badge color mapping. */
function statusColor(s: string): string {
  switch (s) {
    case "ACTIVE": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "PENDING": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    case "CLOSED": return "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500";
    default: return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
  }
}

export default async function CasesPage() {
  const cases = await getCases().catch(() => []);

  return (
    <div>
      <PageHeader title="Cases" description="Track every investigation from intake to close." />
      <Nav />

      {cases.length === 0 ? (
        <EmptyState title="No cases found" description="Cases will appear here once added to the database." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-sm dark:border-white/15 dark:bg-zinc-900">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-100/70 dark:bg-zinc-800/70">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium">Case</th>
                <th className="px-3 py-2.5 text-left font-medium">Title</th>
                <th className="px-3 py-2.5 text-left font-medium">Client</th>
                <th className="px-3 py-2.5 text-left font-medium">Investigator</th>
                <th className="px-3 py-2.5 text-left font-medium">Status</th>
                <th className="px-3 py-2.5 text-left font-medium">Priority</th>
                <th className="px-3 py-2.5 text-left font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id} className="border-t border-black/5 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                  <td className="px-3 py-2.5 font-medium">{c.caseCode}</td>
                  <td className="px-3 py-2.5">{c.title}</td>
                  <td className="px-3 py-2.5">{c.client.company}</td>
                  <td className="px-3 py-2.5">{c.investigator || "—"}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor(c.priority)}`}>
                      {c.priority}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">{c.dueDate ? c.dueDate.toISOString().slice(0, 10) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
