/**
 * @module app/evidence/page
 * Evidence vault page -- server component wrapper that fetches data
 * and delegates to the interactive EvidenceClient component.
 */

import { EvidenceClient } from "@/components/evidence-client";
import { getEvidenceItems, getCases } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function EvidencePage() {
  const [evidence, cases] = await Promise.all([
    getEvidenceItems().catch(() => []),
    getCases().catch(() => []),
  ]);

  // Serialize dates for client component
  const serializedEvidence = evidence.map((e) => ({
    id: e.id,
    evidenceCode: e.evidenceCode,
    title: e.title,
    type: e.type,
    filePath: e.filePath,
    chainOfCustody: e.chainOfCustody,
    uploadedAt: e.uploadedAt.toISOString(),
    caseCode: e.case.caseCode,
    uploadedByName: e.uploadedBy?.name ?? null,
  }));

  const serializedCases = cases.map((c) => ({
    id: c.id,
    caseCode: c.caseCode,
    title: c.title,
  }));

  return <EvidenceClient evidence={serializedEvidence} cases={serializedCases} />;
}
