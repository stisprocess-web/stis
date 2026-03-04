/**
 * @module app/cases/page
 * Cases list page -- server component wrapper that fetches data
 * and delegates to the interactive CasesClient component.
 */

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { CasesClient } from "@/components/cases-client";
import { getCases, getClients } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const [cases, clients] = await Promise.all([
    getCases().catch(() => []),
    getClients().catch(() => []),
  ]);

  // Serialize dates for client component (Date objects cannot cross server/client boundary)
  const serializedCases = cases.map((c) => ({
    id: c.id,
    caseCode: c.caseCode,
    title: c.title,
    status: c.status,
    priority: c.priority,
    investigator: c.investigator,
    dueDate: c.dueDate ? c.dueDate.toISOString().slice(0, 10) : null,
    client: {
      id: c.client.id,
      company: c.client.company,
    },
  }));

  const serializedClients = clients.map((cl) => ({
    id: cl.id,
    name: cl.name,
    company: cl.company,
  }));

  if (cases.length === 0 && clients.length === 0) {
    return (
      <div>
        <PageHeader title="Cases" description="Track every investigation from intake to close." />
        <EmptyState
          title="No cases found"
          description="Cases will appear here once added to the database."
        />
      </div>
    );
  }

  return <CasesClient cases={serializedCases} clients={serializedClients} />;
}
