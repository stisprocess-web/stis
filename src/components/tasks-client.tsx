"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Modal, ConfirmModal } from "@/components/modal";
import { Plus, Trash2, Calendar, User, CheckSquare } from "lucide-react";

interface Task {
  id: string;
  title: string;
  owner: string;
  done: boolean;
  dueDate: string | null;
  caseCode: string;
  caseId: string;
}

interface CaseOption {
  id: string;
  caseCode: string;
  title: string;
}

interface TasksClientProps {
  tasks: Task[];
  cases: CaseOption[];
}

type FilterTab = "all" | "open" | "completed";

const emptyForm = { title: "", caseId: "", owner: "", dueDate: "" };

export function TasksClient({ tasks, cases }: TasksClientProps) {
  const router = useRouter();
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // Add modal
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [addLoading, setAddLoading] = useState(false);

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toggle loading state per task
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  const filtered = tasks.filter((t) => {
    if (activeTab === "open") return !t.done;
    if (activeTab === "completed") return t.done;
    return true;
  });

  const counts = {
    all: tasks.length,
    open: tasks.filter((t) => !t.done).length,
    completed: tasks.filter((t) => t.done).length,
  };

  function isOverdue(dueDate: string | null, done: boolean): boolean {
    if (!dueDate || done) return false;
    return new Date(dueDate) < new Date(new Date().toISOString().slice(0, 10));
  }

  async function handleToggle(task: Task) {
    setTogglingIds((prev) => new Set(prev).add(task.id));
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !task.done }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update task");
      }
      router.refresh();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  }

  async function handleAdd() {
    setAddLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: addForm.title,
          caseId: addForm.caseId,
          owner: addForm.owner,
          dueDate: addForm.dueDate || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create task");
      }
      setAddOpen(false);
      setAddForm(emptyForm);
      showToast("success", "Task created successfully");
      router.refresh();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/tasks/${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete task");
      }
      setDeleteOpen(false);
      setDeleteId(null);
      showToast("success", "Task deleted successfully");
      router.refresh();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setDeleteLoading(false);
    }
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "completed", label: "Completed" },
  ];

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
        title="Tasks"
        description="Assign field work, due dates, and completion status."
        actions={
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-border bg-surface p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-surface-elevated text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab.label}
            <span
              className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                activeTab === tab.key
                  ? "bg-accent/15 text-accent"
                  : "bg-surface-elevated text-text-muted"
              }`}
            >
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Task List */}
      {filtered.length === 0 ? (
        <EmptyState
          title={
            activeTab === "all"
              ? "No tasks found"
              : activeTab === "open"
                ? "No open tasks"
                : "No completed tasks"
          }
          description={
            activeTab === "all"
              ? "Tasks will appear here once created."
              : activeTab === "open"
                ? "All tasks have been completed."
                : "No tasks have been completed yet."
          }
          icon={<CheckSquare className="h-10 w-10" />}
          action={
            activeTab !== "completed" ? (
              <button
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Task
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const overdue = isOverdue(t.dueDate, t.done);
            const isToggling = togglingIds.has(t.id);

            return (
              <article
                key={t.id}
                className={`flex items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-elevated ${
                  t.done ? "opacity-60" : ""
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggle(t)}
                  disabled={isToggling}
                  className="mt-0.5 shrink-0"
                  title={t.done ? "Mark as open" : "Mark as done"}
                >
                  {isToggling ? (
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
                  ) : (
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                        t.done
                          ? "border-success bg-success text-white"
                          : "border-border hover:border-accent"
                      }`}
                    >
                      {t.done && (
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </span>
                  )}
                </button>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <h3
                    className={`text-sm font-semibold ${
                      t.done
                        ? "text-text-muted line-through"
                        : "text-text-primary"
                    }`}
                  >
                    {t.title}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
                    <span className="inline-flex items-center gap-1 font-mono">
                      {t.caseCode}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3 w-3 text-text-muted" />
                      {t.owner}
                    </span>
                    {t.dueDate && (
                      <span
                        className={`inline-flex items-center gap-1 ${
                          overdue ? "font-medium text-error" : ""
                        }`}
                      >
                        <Calendar className="h-3 w-3" />
                        {overdue ? "OVERDUE: " : "Due "}
                        {t.dueDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => {
                    setDeleteId(t.id);
                    setDeleteOpen(true);
                  }}
                  className="shrink-0 rounded-lg p-1.5 text-text-muted hover:bg-error/10 hover:text-error transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </article>
            );
          })}
        </div>
      )}

      {/* New Task Modal */}
      <Modal
        open={addOpen}
        onClose={() => { setAddOpen(false); setAddForm(emptyForm); }}
        title="New Task"
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
              disabled={addLoading || !addForm.title || !addForm.caseId || !addForm.owner}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {addLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating...
                </span>
              ) : (
                "Create Task"
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
              placeholder="Review surveillance footage"
              className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
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
            <label className="mb-1 block text-sm font-medium text-text-secondary">Owner</label>
            <input
              type="text"
              value={addForm.owner}
              onChange={(e) => setAddForm({ ...addForm, owner: e.target.value })}
              placeholder="Jane Doe"
              className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Due Date <span className="text-text-muted">(optional)</span>
            </label>
            <input
              type="date"
              value={addForm.dueDate}
              onChange={(e) => setAddForm({ ...addForm, dueDate: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteId(null); }}
        onConfirm={handleDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}
