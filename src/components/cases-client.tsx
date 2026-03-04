"use client";

/**
 * @module components/cases-client
 * Interactive cases table with sorting, new-case modal, archive actions,
 * and case assignment management (admin only).
 */

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowUpDown, X, Loader2, Archive, UserPlus, UserMinus, Lock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";

/* ── Types ──────────────────────────────────────────────────────────── */

interface CaseAssignment {
  userId: string;
  userName: string;
  userEmail: string;
}

interface SerializedCase {
  id: string;
  caseCode: string;
  title: string;
  status: string;
  priority: string;
  investigator: string | null;
  visibility?: string;
  dueDate: string | null;
  client: { id: string; company: string };
  assignments?: CaseAssignment[];
}

interface SerializedClient {
  id: string;
  name: string;
  company: string;
}

interface SerializedUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

type SortKey = "caseCode" | "title" | "client" | "investigator" | "status" | "priority" | "dueDate";
type SortDir = "asc" | "desc";

const PRIORITY_ORDER: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
const STATUS_ORDER: Record<string, number> = { ACTIVE: 4, INTAKE: 3, PENDING: 2, CLOSED: 1 };

/* ── Component ──────────────────────────────────────────────────────── */

export function CasesClient({
  cases,
  clients,
  userRole = "client",
  users = [],
}: {
  cases: SerializedCase[];
  clients: SerializedClient[];
  userRole?: string;
  users?: SerializedUser[];
}) {
  const router = useRouter();
  const canCreate = ["owner", "admin", "management"].includes(userRole);
  const canAssign = ["owner", "admin", "management"].includes(userRole);
  const canArchive = ["owner", "admin"].includes(userRole);

  /* Sort state */
  const [sortKey, setSortKey] = useState<SortKey>("caseCode");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  /* Modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /* Assignment modal state */
  const [assignModalCaseId, setAssignModalCaseId] = useState<string | null>(null);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  /* Archive loading state (per-case) */
  const [archiving, setArchiving] = useState<string | null>(null);

  /* Form fields */
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [investigator, setInvestigator] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [visibility, setVisibility] = useState("normal");

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
    setVisibility("normal");
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
          visibility,
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

  const handleAssign = async (caseId: string) => {
    if (!assignUserId) return;
    setAssignLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: assignUserId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        alert(typeof err.error === "string" ? err.error : "Failed to assign");
        return;
      }
      setAssignUserId("");
      setAssignModalCaseId(null);
      router.refresh();
    } catch {
      alert("Network error.");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleUnassign = async (caseId: string, userId: string) => {
    if (!confirm("Remove this assignment?")) return;
    try {
      const res = await fetch(`/api/cases/${caseId}/assignments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        alert("Failed to remove assignment");
        return;
      }
      router.refresh();
    } catch {
      alert("Network error.");
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

  const assignModalCase = assignModalCaseId ? cases.find((c) => c.id === assignModalCaseId) : null;

  return (
    <div>
      <PageHeader
        title="Cases"
        description="Track every investigation from intake to close."
        actions={
          canCreate ? (
            <button
              onClick={openModal}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <Plus className="h-4 w-4" />
              New Case
            </button>
          ) : undefined
        }
      />

      {cases.length === 0 ? (
        <EmptyState
          title="No cases found"
          description={userRole === "investigator" ? "No cases have been assigned to you." : "Create your first case to get started."}
          action={
            canCreate ? (
              <button
                onClick={openModal}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                <Plus className="h-4 w-4" />
                New Case
              </button>
            ) : undefined
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
                {(canArchive || canAssign) && (
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedCases.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-border transition-colors hover:bg-surface-elevated/50"
                >
                  <td className="px-4 py-3 font-medium text-accent">
                    <span className="inline-flex items-center gap-1.5">
                      {c.caseCode}
                      {c.visibility === "confidential" && (
                        <span title="Confidential"><Lock className="h-3 w-3 text-warning" /></span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-primary">{c.title}</td>
                  <td className="px-4 py-3 text-text-secondary">{c.client.company}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {c.assignments && c.assignments.length > 0
                      ? c.assignments.map((a) => a.userName).join(", ")
                      : c.investigator || "\u2014"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.priority} />
                  </td>
                  <td className="px-4 py-3 text-text-muted">{c.dueDate || "\u2014"}</td>
                  {(canArchive || canAssign) && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {canAssign && (
                          <button
                            onClick={() => setAssignModalCaseId(c.id)}
                            title="Manage assignments"
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent"
                          >
                            <UserPlus className="h-3 w-3" />
                            Assign
                          </button>
                        )}
                        {canArchive && (
                          <button
                            onClick={() => handleArchive(c.id, c.caseCode)}
                            disabled={archiving === c.id || c.status === "CLOSED"}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-error hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {archiving === c.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Archive className="h-3 w-3" />
                            )}
                            Archive
                          </button>
                        )}
                      </div>
                    </td>
                  )}
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

              {/* Visibility — admin only */}
              {["owner", "admin"].includes(userRole) && (
                <div>
                  <label htmlFor="case-visibility" className="mb-1.5 block text-sm font-medium text-text-secondary">
                    Visibility
                  </label>
                  <select
                    id="case-visibility"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                  >
                    <option value="normal">Normal</option>
                    <option value="confidential">Confidential</option>
                  </select>
                </div>
              )}

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

      {/* ── Assignment Modal ─────────────────────────────────────────── */}
      {assignModalCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">
                Assign Investigators — {assignModalCase.caseCode}
              </h2>
              <button
                onClick={() => setAssignModalCaseId(null)}
                className="rounded-md p-1 text-text-muted transition-colors hover:bg-border hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Current assignments */}
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-text-secondary">Current Assignments</p>
              {(!assignModalCase.assignments || assignModalCase.assignments.length === 0) ? (
                <p className="text-sm text-text-muted">No investigators assigned yet.</p>
              ) : (
                <ul className="space-y-2">
                  {assignModalCase.assignments.map((a) => (
                    <li key={a.userId} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{a.userName}</p>
                        <p className="text-xs text-text-muted">{a.userEmail}</p>
                      </div>
                      <button
                        onClick={() => handleUnassign(assignModalCase.id, a.userId)}
                        className="rounded-md p-1 text-text-muted hover:text-error"
                        title="Remove assignment"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Add assignment */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">Add Investigator</label>
                <select
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                >
                  <option value="">Select user...</option>
                  {users
                    .filter((u) => !assignModalCase.assignments?.some((a) => a.userId === u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                </select>
              </div>
              <button
                onClick={() => handleAssign(assignModalCase.id)}
                disabled={!assignUserId || assignLoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {assignLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
