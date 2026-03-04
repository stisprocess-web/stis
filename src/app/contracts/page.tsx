/**
 * @module app/contracts/page
 * Contracts page -- server component wrapper that fetches data
 * and delegates to the interactive ContractsClient component.
 */

import { ContractsClient } from "@/components/contracts-client";
import { listContracts } from "@/lib/contracts";

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  const contracts = await listContracts().catch(() => []);

  // Serialize contract records (already plain objects from JSON store, but ensure consistency)
  // The JSON store may have extra fields beyond the typed interface, so cast through unknown.
  const serializedContracts = contracts.map((c) => {
    const raw = c as unknown as Record<string, unknown>;
    return {
      id: c.id,
      caseCode: c.caseCode,
      clientName: c.clientName,
      clientEmail: c.clientEmail,
      templateName: c.templateName,
      status: c.status,
      pdfPath: c.pdfPath || null,
      sentAt: c.sentAt || null,
      signedAt: c.signedAt || null,
      retainerAmount: (typeof raw.retainerAmount === "string" ? raw.retainerAmount : null),
      hourlyRate: (typeof raw.hourlyRate === "string" ? raw.hourlyRate : null),
      createdAt: (typeof raw.createdAt === "string" ? raw.createdAt : null),
    };
  });

  if (contracts.length === 0) {
    return (
      <div>
        <ContractsClient contracts={[]} />
      </div>
    );
  }

  return <ContractsClient contracts={serializedContracts} />;
}
