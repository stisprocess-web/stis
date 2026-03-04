/**
 * @module app/cases/page
 * Cases list page -- server component wrapper that fetches data
 * and delegates to the interactive CasesClient component.
 *
 * Role-aware: investigators see only assigned cases.
 */

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { CasesClient } from "@/components/cases-client";
import { getCases, getClients, getUsers } from "@/lib/data";
import { getRoleContext, getServerSession } from "@/lib/server-auth";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const [ctx, session] = await Promise.all([getRoleContext(), getServerSession()]);
  const role = session?.role ?? "client";

  const [cases, clients, users] = await Promise.all([
    getCases(ctx).catch(() => []),
    getClients().catch(() => []),
    isAdmin(role) ? getUsers().catch(() => []) : Promise.resolve([]),
  ]);

  // Serialize dates for client component (Date objects cannot cross server/client boundary)
  const serializedCases = cases.map((c) => ({
    id: c.id,
    caseCode: c.caseCode,
    title: c.title,
    status: c.status,
    priority: c.priority,
    investigator: c.investigator,
    visibility: c.visibility,
    dueDate: c.dueDate ? c.dueDate.toISOString().slice(0, 10) : null,
    client: {
      id: c.client.id,
      company: c.client.company,
    },
    assignments: c.assignments?.map((a: { user: { id: string; name: string; email: string } }) => ({
      userId: a.user.id,
      userName: a.user.name,
      userEmail: a.user.email,
    })) ?? [],
  }));

  const serializedClients = clients.map((cl) => ({
    id: cl.id,
    name: cl.name,
    company: cl.company,
  }));

  const serializedUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
  }));

  if (cases.length === 0 && clients.length === 0) {
    return (
      <div>
        <PageHeader title="Cases" description="Track every investigation from intake to close." />
        <EmptyState
          title="No cases found"
          description={role === "investigator" ? "No cases have been assigned to you." : "Cases will appear here once added to the database."}
        />
      </div>
    );
  }

  return <CasesClient cases={serializedCases} clients={serializedClients} userRole={role} users={serializedUsers} />;
}
