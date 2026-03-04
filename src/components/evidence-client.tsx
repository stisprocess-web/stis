"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Modal } from "@/components/modal";
import { Plus, Shield, ChevronDown, ChevronUp } from "lucide-react";

interface EvidenceItem {
  id: string;
  evidenceCode: string;
  title: string;
  type: string;
  filePath: string | null;
  chainOfCustody: string;
  uploadedAt: string;
  caseCode: string;
  uploadedByName: string | null;
}

interface CaseOption {
  id: string;
  caseCode: string;
  title: string;
}

interface EvidenceClientProps {
  evidence: EvidenceItem[];
  cases: CaseOption[];
}

const EVIDENCE_TYPES = ["Video", "Photo", "Audio", "Document"] as const;

function typeBadgeColor(type: string): string {
  switch (type) {
    case "Video":
      return "bg-accent/15 text-accent";
    case "Photo":
      return "bg-success/15 text-success";
    case "Audio":
      return "bg-warning/15 text-warning";
    case "Document":
      return "bg-text-muted/15 text-text-muted";
    default:
      return "bg-text-muted/15 text-text-muted";
  }
}

const emptyForm = {
  title: "",
  type: "Video" as string,
  caseId: "",
  filePath: "",
  chainOfCustody: "",
};

export function EvidenceClient({ evidence, cases }: EvidenceClientProps) {
  const router = useRouter();
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Add modal
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [addLoading, setAddLoading] = useState(false);

  // Expanded chain of custody rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleAdd() {
    setAddLoading(true);
    try {
      const res = await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: addForm.title,
          type: addForm.type,
          caseId: addForm.caseId,
          filePath: addForm.filePath || undefined,
          chainOfCustody: addForm.chainOfCustody,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to log evidence");
      }
      setAddOpen(false);
      setAddForm(emptyForm);
      showToast("success", "Evidence logged successfully");
      router.refresh();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to log evidence");
    } finally {
      setAddLoading(false);
    }
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-4 top-4 z-[100] rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "success"
              ? "border border-success/30 bg-success/15 text-success"
              : "border border-error/30 bg-error/15 text-error"
          }`}
        >
          {toast.message}
        </div>
      )}

      <PageHeader
        title="Evidence Vault"
        description="Immutable logging and chain-of-custody snapshots."
        actions={
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            Log Evidence
          </button>
        }
      />

      {/* Evidence Table */}
      {evidence.length === 0 ? (
        <EmptyState
          title="No evidence logged"
          description="Evidence items will appear here once uploaded."
          icon={<Shield className="h-10 w-10" />}
          action={
            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            >
              <Plus className="h-4 w-4" />
              Log Evidence
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-elevated">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                  Case
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                  Uploaded By
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                  Chain of Custody
                </th>
              </tr>
            </thead>
            <tbody>
              {evidence.map((e) => {
                const isExpanded = expandedRows.has(e.id);
                const chainText = e.chainOfCustody || "";
                const isTruncated = chainText.length > 60;
                return (
                  <tr
                    key={e.id}
                    className="border-b border-border last:border-b-0 transition-colors hover:bg-surface-elevated"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-text-primary">
                      {e.evidenceCode}
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {e.title}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${typeBadgeColor(e.type)}`}
                      >
                        {e.type}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-text-secondary">
                      {e.caseCode}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                      {e.uploadedByName || "\u2014"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                      {formatDate(e.uploadedAt)}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-text-secondary">
                      {isTruncated ? (
                        <div>
                          <span>
                            {isExpanded
                              ? chainText
                              : `${chainText.slice(0, 60)}...`}
                          </span>
                          <button
                            onClick={() => toggleRow(e.id)}
                            className="ml-1 inline-flex items-center gap-0.5 text-xs text-accent hover:text-accent-hover"
                          >
                            {isExpanded ? (
                              <>
                                Less <ChevronUp className="h-3 w-3" />
                              </>
                            ) : (
                              <>
                                More <ChevronDown className="h-3 w-3" />
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        chainText || "\u2014"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Log Evidence Modal */}
      <Modal
        open={addOpen}
        onClose={() => { setAddOpen(false); setAddForm(emptyForm); }}
        title="Log Evidence"
        actions={
          <>
            <button
              onClick={() => { setAddOpen(false); setAddForm(emptyForm); }}
              disabled={addLoading}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={
                addLoading || !addForm.title || !addForm.type || !addForm.caseId || !addForm.chainOfCustody
              }
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {addLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Logging...
                </span>
              ) : (
                "Log Evidence"
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Title</label>
            <input
              type="text"
              value={addForm.title}
              onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
              placeholder="Surveillance footage - Main St."
              className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Type</label>
            <select
              value={addForm.type}
              onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {EVIDENCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Case</label>
            <select
              value={addForm.caseId}
              onChange={(e) => setAddForm({ ...addForm, caseId: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Select a case...</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseCode} - {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              File Path <span className="text-text-muted">(optional)</span>
            </label>
            <input
              type="text"
              value={addForm.filePath}
              onChange={(e) => setAddForm({ ...addForm, filePath: e.target.value })}
              placeholder="/evidence/2024/video-001.mp4"
              className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Chain of Custody
            </label>
            <textarea
              value={addForm.chainOfCustody}
              onChange={(e) => setAddForm({ ...addForm, chainOfCustody: e.target.value })}
              placeholder="Describe the chain of custody for this evidence item..."
              rows={3}
              className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
