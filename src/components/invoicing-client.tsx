"use client";

/**
 * @module components/invoicing-client
 * Interactive invoicing page with invoice table, status management,
 * new invoice modal, time billing, and expense sections.
 */

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Trash2,
  DollarSign,
  Clock,
  Receipt,
  Download,
  ChevronDown,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Modal, ConfirmModal } from "@/components/modal";

/* ── Types ──────────────────────────────────────────────────────────── */

interface SerializedInvoice {
  id: string;
  invoiceCode: string;
  amountUsd: number;
  status: string;
  issuedDate: string | null;
  dueDate: string | null;
  client: { id: string; company: string };
  case: { id: string; caseCode: string };
}

interface SerializedTimeEntry {
  id: string;
  hours: number;
  billableAmountUsd: number;
  workDate: string | null;
  notes: string | null;
  contractor: { name: string };
  case: { caseCode: string };
}

interface SerializedExpense {
  id: string;
  amountUsd: number;
  category: string;
  status: string;
  spentDate: string | null;
  notes: string | null;
  contractor: { name: string };
  case: { caseCode: string };
}

interface SerializedClient {
  id: string;
  name: string;
  company: string;
}

interface SerializedCase {
  id: string;
  caseCode: string;
  title: string;
}

interface InvoicingClientProps {
  invoices: SerializedInvoice[];
  timeEntries: SerializedTimeEntry[];
  expenses: SerializedExpense[];
  clients: SerializedClient[];
  cases: SerializedCase[];
}

const STATUSES = ["DRAFT", "SENT", "PAID", "OVERDUE"] as const;

/* ── Component ──────────────────────────────────────────────────────── */

export function InvoicingClient({
  invoices,
  timeEntries,
  expenses,
  clients,
  cases,
}: InvoicingClientProps) {
  const router = useRouter();

  /* Modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /* Delete confirm state */
  const [deleteTarget, setDeleteTarget] = useState<SerializedInvoice | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* Status change loading state */
  const [statusLoading, setStatusLoading] = useState<string | null>(null);

  /* Form fields */
  const [clientId, setClientId] = useState("");
  const [caseId, setCaseId] = useState("");
  const [amountUsd, setAmountUsd] = useState("");
  const [dueDate, setDueDate] = useState("");

  /* ── Summary stats ───────────────────────────────────────────────── */

  const stats = useMemo(() => {
    let outstanding = 0;
    let paid = 0;
    let draft = 0;
    for (const inv of invoices) {
      if (inv.status === "PAID") paid += inv.amountUsd;
      else if (inv.status === "DRAFT") draft += inv.amountUsd;
      else outstanding += inv.amountUsd;
    }
    return { outstanding, paid, draft };
  }, [invoices]);

  /* ── Handlers ────────────────────────────────────────────────────── */

  const resetForm = () => {
    setClientId("");
    setCaseId("");
    setAmountUsd("");
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
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          caseId,
          amountUsd: parseFloat(amountUsd),
          dueDate: dueDate || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(typeof err.error === "string" ? err.error : "Failed to create invoice");
      }

      closeModal();
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    setStatusLoading(invoiceId);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        alert(typeof err.error === "string" ? err.error : "Failed to update status");
        return;
      }
      router.refresh();
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setStatusLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/invoices/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        alert(typeof err.error === "string" ? err.error : "Failed to delete invoice");
        return;
      }
      setDeleteTarget(null);
      router.refresh();
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <div>
      <PageHeader
        title="Invoicing"
        description="Track billables, invoice statuses, and payment flow."
        actions={
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </button>
        }
      />

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/15">
            <DollarSign className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Total Outstanding</p>
            <p className="text-xl font-bold text-text-primary">${stats.outstanding.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/15">
            <DollarSign className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Total Paid</p>
            <p className="text-xl font-bold text-text-primary">${stats.paid.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-text-muted/15">
            <DollarSign className="h-5 w-5 text-text-muted" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Total Draft</p>
            <p className="text-xl font-bold text-text-primary">${stats.draft.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices"
          description="Create your first invoice to get started."
          action={
            <button
              onClick={openModal}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <Plus className="h-4 w-4" />
              New Invoice
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-surface-elevated">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Invoice Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Case</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Amount ($)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Issued</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Due</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-t border-border transition-colors hover:bg-surface-elevated/50"
                >
                  <td className="px-4 py-3 font-medium text-accent">{inv.invoiceCode}</td>
                  <td className="px-4 py-3 text-text-secondary">{inv.client.company}</td>
                  <td className="px-4 py-3 text-text-secondary">{inv.case.caseCode}</td>
                  <td className="px-4 py-3 text-text-primary font-medium">${inv.amountUsd.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-3 text-text-muted">{inv.issuedDate || "\u2014"}</td>
                  <td className="px-4 py-3 text-text-muted">{inv.dueDate || "\u2014"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {/* Status change dropdown */}
                      <div className="relative">
                        <select
                          value={inv.status}
                          disabled={statusLoading === inv.id}
                          onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                          className="appearance-none rounded-md border border-border bg-background py-1 pl-2 pr-7 text-xs text-text-primary outline-none focus:border-accent disabled:opacity-50"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-text-muted" />
                      </div>
                      {statusLoading === inv.id && (
                        <Loader2 className="h-3 w-3 animate-spin text-accent" />
                      )}
                      {/* Delete button */}
                      <button
                        onClick={() => setDeleteTarget(inv)}
                        className="rounded-md border border-border p-1 text-text-muted transition-colors hover:border-error hover:text-error"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 1099 Time Billing & Expenses */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Time Billing */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-text-primary">1099 Time Billing</h2>
          </div>
          {timeEntries.length === 0 ? (
            <EmptyState title="No time entries" description="Time entries will appear here once logged." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary">Contractor</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary">Case</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary">Hours</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary">Billable</th>
                  </tr>
                </thead>
                <tbody>
                  {timeEntries.map((t) => (
                    <tr key={t.id} className="border-t border-border/50">
                      <td className="px-3 py-2 text-text-primary">{t.contractor.name}</td>
                      <td className="px-3 py-2 text-text-secondary">{t.case.caseCode}</td>
                      <td className="px-3 py-2 text-text-secondary">{t.hours}h</td>
                      <td className="px-3 py-2 font-medium text-text-primary">${t.billableAmountUsd.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Expenses */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Receipt className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-text-primary">1099 Expenses</h2>
          </div>
          {expenses.length === 0 ? (
            <EmptyState title="No expenses" description="Expenses will appear here once submitted." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary">Contractor</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary">Case</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary">Category</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} className="border-t border-border/50">
                      <td className="px-3 py-2 text-text-primary">{e.contractor.name}</td>
                      <td className="px-3 py-2 text-text-secondary">{e.case.caseCode}</td>
                      <td className="px-3 py-2 text-text-secondary">{e.category}</td>
                      <td className="px-3 py-2 font-medium text-text-primary">${e.amountUsd.toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={e.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Export Buttons */}
      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href="/api/exports/time-entries.csv"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary"
        >
          <Download className="h-4 w-4" />
          Export Time CSV
        </a>
        <a
          href="/api/exports/expenses.csv"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary"
        >
          <Download className="h-4 w-4" />
          Export Expenses CSV
        </a>
      </div>

      {/* ── New Invoice Modal ────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="New Invoice"
        actions={
          <>
            <button
              onClick={closeModal}
              disabled={formLoading}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="new-invoice-form"
              disabled={formLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {formLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {formLoading ? "Creating..." : "Create Invoice"}
            </button>
          </>
        }
      >
        {formError && (
          <div className="mb-4 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
            {formError}
          </div>
        )}

        <form id="new-invoice-form" onSubmit={handleCreate} className="space-y-4">
          {/* Client */}
          <div>
            <label htmlFor="inv-client" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Client <span className="text-error">*</span>
            </label>
            <select
              id="inv-client"
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

          {/* Case */}
          <div>
            <label htmlFor="inv-case" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Case <span className="text-error">*</span>
            </label>
            <select
              id="inv-case"
              required
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            >
              <option value="">Select a case...</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseCode} - {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Amount + Due Date row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="inv-amount" className="mb-1.5 block text-sm font-medium text-text-secondary">
                Amount ($) <span className="text-error">*</span>
              </label>
              <input
                id="inv-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amountUsd}
                onChange={(e) => setAmountUsd(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor="inv-due" className="mb-1.5 block text-sm font-medium text-text-secondary">
                Due Date
              </label>
              <input
                id="inv-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirmation Modal ────────────────────────────────── */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${deleteTarget?.invoiceCode}? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}
