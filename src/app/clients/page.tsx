/**
 * @module app/clients/page
 * Clients list page — card layout for client accounts.
 */

import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { getClients } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await getClients().catch(() => []);

  return (
    <div>
      <PageHeader title="Clients" description="Manage accounts, contacts, and retainers." />
      <Nav />

      {clients.length === 0 ? (
        <EmptyState title="No clients found" description="Clients will appear here once added to the database." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <article key={c.id} className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900">
              <h2 className="font-semibold">{c.name}</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{c.company}</p>
              <div className="mt-3 space-y-1 text-xs text-zinc-500">
                <p>{c.email}</p>
                <p>{c.phone}</p>
              </div>
              <p className="mt-3 text-sm font-medium">
                Retainer: ${c.retainerUsd.toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
