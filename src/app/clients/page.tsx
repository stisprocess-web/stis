/**
 * @module app/clients/page
 * Clients list page -- server component wrapper that fetches data
 * and delegates to the interactive ClientsClient component.
 */

import { ClientsClient } from "@/components/clients-client";
import { getClients } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await getClients().catch(() => []);

  // Serialize dates for client component (Date objects cannot cross server/client boundary)
  const serializedClients = clients.map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company,
    email: c.email,
    phone: c.phone,
    retainerUsd: c.retainerUsd,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return <ClientsClient clients={serializedClients} />;
}
