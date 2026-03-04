"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Modal, ConfirmModal } from "@/components/modal";
import { Search, Plus, Pencil, Trash2, DollarSign, Building2, Mail, Phone } from "lucide-react";

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  retainerUsd: number;
  createdAt: string;
  updatedAt: string;
}

interface ClientsClientProps {
  clients: Client[];
}

const emptyForm = { name: "", company: "", email: "", phone: "", retainerUsd: "" };

export function ClientsClient({ clients }: ClientsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Add modal
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [addLoading, setAddLoading] = useState(false);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleAdd() {
    setAddLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name,
          company: addForm.company,
          email: addForm.email,
          phone: addForm.phone,
          retainerUsd: addForm.retainerUsd ? parseFloat(addForm.retainerUsd) : 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create client");
      }
      setAddOpen(false);
      setAddForm(emptyForm);
      showToast("success", "Client created successfully");
      router.refresh();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to create client");
    } finally {
      setAddLoading(false);
    }
  }

  function openEdit(client: Client) {
    setEditId(client.id);
    setEditForm({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      retainerUsd: String(client.retainerUsd),
    });
    setEditOpen(true);
  }

  async function handleEdit() {
    if (!editId) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/clients/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          company: editForm.company,
          email: editForm.email,
          phone: editForm.phone,
          retainerUsd: editForm.retainerUsd ? parseFloat(editForm.retainerUsd) : 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update client");
      }
      setEditOpen(false);
      setEditId(null);
      setEditForm(emptyForm);
      showToast("success", "Client updated successfully");
      router.refresh();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to update client");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/clients/${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete client");
      }
      setDeleteOpen(false);
      setDeleteId(null);
      showToast("success", "Client deleted successfully");
      router.refresh();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to delete client");
    } finally {
      setDeleteLoading(false);
    }
  }

  function renderForm(
    form: typeof emptyForm,
    setForm: (f: typeof emptyForm) => void,
  ) {
    return (
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="John Smith"
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Company</label>
          <input
            type="text"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            placeholder="Acme Corp"
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="john@acme.com"
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="(555) 123-4567"
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Retainer (USD)</label>
          <input
            type="number"
            value={form.retainerUsd}
            onChange={(e) => setForm({ ...form, retainerUsd: e.target.value })}
            placeholder="0"
            min="0"
            step="0.01"
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>
    );
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
        title="Clients"
        description="Manage accounts, contacts, and retainers."
        actions={
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Client
          </button>
        }
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, company, or email..."
          className="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Client Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title={search ? "No matching clients" : "No clients found"}
          description={
            search
              ? "Try adjusting your search query."
              : "Clients will appear here once added."
          }
          action={
            !search ? (
              <button
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Client
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <article
              key={c.id}
              className="rounded-xl border border-border bg-surface p-5 transition-colors hover:bg-surface-elevated"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-text-primary">{c.name}</h2>
                  <div className="mt-0.5 flex items-center gap-1.5 text-sm text-text-secondary">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{c.company}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => openEdit(c)}
                    className="rounded-lg p-1.5 text-text-muted hover:bg-white/5 hover:text-text-primary transition-colors"
                    title="Edit client"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { setDeleteId(c.id); setDeleteOpen(true); }}
                    className="rounded-lg p-1.5 text-text-muted hover:bg-error/10 hover:text-error transition-colors"
                    title="Delete client"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-sm text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                  <span className="truncate">{c.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                  <span>{c.phone || "No phone"}</span>
                </div>
              </div>

              {c.retainerUsd > 0 && (
                <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-1.5 text-sm font-medium text-success">
                  <DollarSign className="h-3.5 w-3.5" />
                  Retainer: ${c.retainerUsd.toLocaleString()}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      <Modal
        open={addOpen}
        onClose={() => { setAddOpen(false); setAddForm(emptyForm); }}
        title="Add Client"
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
              disabled={addLoading || !addForm.name || !addForm.company || !addForm.email}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {addLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating...
                </span>
              ) : (
                "Create Client"
              )}
            </button>
          </>
        }
      >
        {renderForm(addForm, setAddForm)}
      </Modal>

      {/* Edit Client Modal */}
      <Modal
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditId(null); setEditForm(emptyForm); }}
        title="Edit Client"
        actions={
          <>
            <button
              onClick={() => { setEditOpen(false); setEditId(null); setEditForm(emptyForm); }}
              disabled={editLoading}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEdit}
              disabled={editLoading || !editForm.name || !editForm.company || !editForm.email}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {editLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </>
        }
      >
        {renderForm(editForm, setEditForm)}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteId(null); }}
        onConfirm={handleDelete}
        title="Delete Client"
        message="Are you sure you want to delete this client? This action cannot be undone and will remove all associated cases."
        confirmLabel="Delete"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}
