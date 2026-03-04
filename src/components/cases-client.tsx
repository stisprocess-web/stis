"use client";

/**
 * @module components/cases-client
 * Interactive cases table with sorting, new-case modal, and archive actions.
 */

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowUpDown, X, Loader2, Archive } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";

/* ── Types ──────────────────────────────────────────────────────────── */

interface SerializedCase {
  id: string;
  caseCode: string;
  title: string;
  status: string;
  priority: string;
  investigator: string | null;
  dueDate: string | null;
  client: { id: string; company: string };
}

interface SerializedClient {
  id: string;
  name: string;
  company: string;
}

type SortKey = "caseCode" | "title" | "client" | "investigator" | "status" | "priority" | "dueDate";
type SortDir = "asc" | "desc";

const PRIORITY_ORDER: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
const STATUS_ORDER: Record<string, number> = { ACTIVE: 4, INTAKE: 3, PENDING: 2, CLOSED: 1 };

/* ── Component ──────────────────────────────────────────────────────── */

export function CasesClient({
  cases,
  clients,
}: {
  cases: SerializedCase[];
  clients: SerializedClient[];
}) {
  const router = useRouter();

  /* Sort state */
  const [sortKey, setSortKey] = useState<SortKey>("caseCode");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  /* Modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /* Archive loading state (per-case) */
  const [archiving, setArchiving] = useState<string | null>(null);

  /* Form fields */
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [investigator, setInvestigator] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");

  /* ── Sorting ────────────────────────────────────────────────────── */

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey],
  );

  const sortedCases = useMemo(() => {
    const sorted = [...cases];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "caseCode":
          cmp = a.caseCode.localeCompare(b.caseCode);
          break;
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "client":
          cmp = a.client.company.localeCompare(b.client.company);
          break;
        case "investigator":
          cmp = (a.investigator ?? "").localeCompare(b.investigator ?? "");
          break;
        case "status":
          cmp = (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0);
          break;
        case "priority":
          cmp = (PRIORITY_ORDER[a.priority] ?? 0) - (PRIORITY_ORDER[b.priority] ?? 0);
          break;
        case "dueDate":
          cmp = (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [cases, sortKey, sortDir]);

  /* ── Handlers ───────────────────────────────────────────────────── */

  const resetForm = () => {
    setTitle("");
    setClientId("");
    setInvestigator("");
    setPriority("MEDIUM");
    setDueDate("");
    setFormError(null);
  };

  const openModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          clientId,
          investigator: investigator || undefined,
          priority,
          dueDate: dueDate || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(typeof err.error === "string" ? err.error : "Failed to create case");
      }

      closeModal();
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  const handleArchive = async (caseId: string, caseCode: string) => {
    if (!confirm(`Archive case ${caseCode}? This will set its status to CLOSED.`)) return;

    setArchiving(caseId);
    try {
      const res = await fetch(`/api/cases/${caseId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        alert(typeof err.error === "string" ? err.error : "Failed to archive case");
        return;
      }
      router.refresh();
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setArchiving(null);
    }
  };

  /* ── Sort header helper ─────────────────────────────────────────── */

  const SortHeader = ({ label, colKey }: { label: string; colKey: SortKey }) => (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
      <button
        onClick={() => handleSort(colKey)}
        className="inline-flex items-center gap-1 hover:text-text-primary"
      >
        {label}
        <ArrowUpDown
          className={`h-3 w-3 ${sortKey === colKey ? "text-accent" : "text-text-muted"}`}
        />
      </button>
    </th>
  );

  /* ── Render ─────────────────────────────────────────────────────── */

  return (
    <div>
      <PageHeader
        title="Cases"
        description="Track every investigation from intake to close."
        actions={
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" />
            New Case
          </button>
        }
      />

      {cases.length === 0 ? (
        <EmptyState
          title="No cases found"
          description="Create your first case to get started."
          action={
            <button
              onClick={openModal}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <Plus className="h-4 w-4" />
              New Case
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="table-zebra min-w-full text-sm">
            <thead className="border-b border-border bg-surface-elevated">
              <tr>
                <SortHeader label="Case Code" colKey="caseCode" />
                <SortHeader label="Title" colKey="title" />
                <SortHeader label="Client" colKey="client" />
                <SortHeader label="Investigator" colKey="investigator" />
                <SortHeader label="Status" colKey="status" />
                <SortHeader label="Priority" colKey="priority" />
                <SortHeader label="Due Date" colKey="dueDate" />
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCases.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-border transition-colors hover:bg-surface-elevated/50"
                >
                  <td className="px-4 py-3 font-medium text-accent">{c.caseCode}</td>
                  <td className="px-4 py-3 text-text-primary">{c.title}</td>
                  <td className="px-4 py-3 text-text-secondary">{c.client.company}</td>
                  <td className="px-4 py-3 text-text-secondary">{c.investigator || "\u2014"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.priority} />
                  </td>
                  <td className="px-4 py-3 text-text-muted">{c.dueDate || "\u2014"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleArchive(c.id, c.caseCode)}
                      disabled={archiving === c.id || c.status === "CLOSED"}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-error hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {archiving === c.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Archive className="h-3 w-3" />
                      )}
                      Archive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── New Case Modal ──────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">New Case</h2>
              <button
                onClick={closeModal}
                className="rounded-md p-1 text-text-muted transition-colors hover:bg-border hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="case-title" className="mb-1.5 block text-sm font-medium text-text-secondary">
                  Title <span className="text-error">*</span>
                </label>
                <input
                  id="case-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Insurance Fraud Investigation"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent"
                />
              </div>

              {/* Client */}
              <div>
                <label htmlFor="case-client" className="mb-1.5 block text-sm font-medium text-text-secondary">
                  Client <span className="text-error">*</span>
                </label>
                <select
                  id="case-client"
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                >
                  <option value="">Select a client...</option>
                  {clients.map((cl) => (
                    <option key={cl.id} value={cl.id}>
                      {cl.company} ({cl.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Investigator */}
              <div>
                <label htmlFor="case-investigator" className="mb-1.5 block text-sm font-medium text-text-secondary">
                  Investigator
                </label>
                <input
                  id="case-investigator"
                  type="text"
                  value={investigator}
                  onChange={(e) => setInvestigator(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent"
                />
              </div>

              {/* Priority + Due Date row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="case-priority" className="mb-1.5 block text-sm font-medium text-text-secondary">
                    Priority
                  </label>
                  <select
                    id="case-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="case-due" className="mb-1.5 block text-sm font-medium text-text-secondary">
                    Due Date
                  </label>
                  <input
                    id="case-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-text-muted hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  {formLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {formLoading ? "Creating..." : "Create Case"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
