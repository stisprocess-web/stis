/**
 * @module app/evidence/page
 * Evidence vault — immutable logging with chain-of-custody tracking.
 */

import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { getEvidenceItems } from "@/lib/data";

export const dynamic = "force-dynamic";

/** Badge color by evidence type. */
function typeColor(type: string): string {
  switch (type) {
    case "Video": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
    case "Photo": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "Audio": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    default: return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  }
}

export default async function EvidencePage() {
  const evidence = await getEvidenceItems().catch(() => []);

  return (
    <div>
      <PageHeader title="Evidence Vault" description="Immutable logging and chain-of-custody snapshots." />
      <Nav />

      {evidence.length === 0 ? (
        <EmptyState title="No evidence logged" description="Evidence items will appear here once uploaded." />
      ) : (
        <div className="space-y-3">
          {evidence.map((e) => (
            <article key={e.id} className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">
                  {e.evidenceCode} — {e.title}
                </h2>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColor(e.type)}`}>
                  {e.type}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Case: {e.case.caseCode}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Uploaded {e.uploadedBy ? `by ${e.uploadedBy.name}` : ""} at{" "}
                {e.uploadedAt.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{e.chainOfCustody}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
