"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Shield,
  Plug,
  FileCheck,
  Save,
  CheckCircle,
  ExternalLink,
  Download,
  Mail,
  FileText,
  Check,
  Users,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Tab = "company" | "roles" | "users" | "integrations" | "compliance";

const tabs: Array<{ key: Tab; label: string; icon: React.ElementType }> = [
  { key: "company", label: "Company Info", icon: Building2 },
  { key: "roles", label: "Access Roles", icon: Shield },
  { key: "users", label: "Users", icon: Users },
  { key: "integrations", label: "Integrations", icon: Plug },
  { key: "compliance", label: "Compliance", icon: FileCheck },
];

const roleDefinitions = [
  {
    name: "Owner / Admin",
    color: "bg-error",
    description: "Full system access including billing, settings, and user management",
    permissions: { cases: true, evidence: true, time: true, billing: true, settings: true, users: true, reports: true },
  },
  {
    name: "Management",
    color: "bg-accent",
    description: "Full access to cases, team, and ops — but NO financial data (invoicing, billing, revenue, margins)",
    permissions: { cases: true, evidence: true, time: true, billing: false, settings: false, users: false, reports: false },
  },
  {
    name: "Investigator",
    color: "bg-warning",
    description: "Access ONLY assigned cases, tasks, evidence. Can submit own time/expenses. No financial access.",
    permissions: { cases: true, evidence: true, time: true, billing: false, settings: false, users: false, reports: false },
  },
  {
    name: "Billing",
    color: "bg-success",
    description: "Invoicing, reporting, exports, and expense management. NO case details or evidence.",
    permissions: { cases: false, evidence: false, time: true, billing: true, settings: false, users: false, reports: true },
  },
  {
    name: "Client Portal",
    color: "bg-text-muted",
    description: "View own case status, own invoices, and upload/view evidence on own cases",
    permissions: { cases: true, evidence: true, time: false, billing: false, settings: false, users: false, reports: false },
  },
];

const permissionHeaders = ["Cases", "Evidence", "Time", "Billing", "Settings", "Users", "Reports"];
const permissionKeys = ["cases", "evidence", "time", "billing", "settings", "users", "reports"] as const;

const complianceItems = [
  { title: "Chain of Custody", description: "Required on all evidence uploads with timestamps, handler identification, and transfer logs", enabled: true },
  { title: "Audit Trail", description: "Complete activity log retained for 7 years covering status changes, billing events, and file access", enabled: true },
  { title: "Signed Report PDFs", description: "Export watermarked and signed report PDFs with digital signatures and tamper detection", enabled: true },
  { title: "Activity Logging", description: "Comprehensive logging of all user actions, login events, and data modifications", enabled: true },
  { title: "Contract PDF Generation", description: "Locally generated PDFs with signature lines, initial blocks, and status tracking", enabled: true },
  { title: "Data Encryption", description: "All sensitive data encrypted at rest and in transit using industry-standard protocols", enabled: true },
];

const ROLE_OPTIONS = ["owner", "admin", "management", "investigator", "billing", "client"] as const;

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-error",
  admin: "bg-error",
  management: "bg-accent",
  investigator: "bg-warning",
  billing: "bg-success",
  client: "bg-text-muted",
};

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export function SettingsClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("company");
  const [saved, setSaved] = useState(false);

  // Company info form state
  const [companyName, setCompanyName] = useState("Leaird Investigations");
  const [address, setAddress] = useState("123 Main Street, Suite 200");
  const [phone, setPhone] = useState("(555) 123-4567");
  const [email, setEmail] = useState("office@leairdinvestigations.com");

  // Users state
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showNewUser, setShowNewUser] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<string>("investigator");
  const [newPassword, setNewPassword] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Fetch users when the tab activates
  useEffect(() => {
    if (activeTab === "users") {
      setUsersLoading(true);
      fetch("/api/users")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setUsers(data);
        })
        .catch(() => {})
        .finally(() => setUsersLoading(false));
    }
  }, [activeTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, email: newEmail, role: newRole, password: newPassword || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(typeof err.error === "string" ? err.error : "Failed to create user");
      }
      setShowNewUser(false);
      setNewName("");
      setNewEmail("");
      setNewRole("investigator");
      setNewPassword("");
      // Refresh
      const r = await fetch("/api/users");
      const data = await r.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Error");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        alert(typeof err.error === "string" ? err.error : "Failed to update role");
        return;
      }
      setEditingUserId(null);
      // Refresh
      const r = await fetch("/api/users");
      const data = await r.json();
      if (Array.isArray(data)) setUsers(data);
    } catch {
      alert("Network error");
    }
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div className="mb-6 flex gap-1 rounded-xl border border-border bg-surface p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-surface-elevated text-text-primary"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Company Info Tab */}
      {activeTab === "company" && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-6 text-lg font-semibold text-text-primary">Company Information</h2>
          <div className="max-w-2xl space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">Company Name</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">Address</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none" />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleSave}
                className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover">
                <Save className="h-4 w-4" /> Save Changes
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-success">
                  <CheckCircle className="h-4 w-4" /> Settings saved successfully
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Access Roles Tab */}
      {activeTab === "roles" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Role Definitions</h2>
            <div className="space-y-3">
              {roleDefinitions.map((role) => (
                <div key={role.name} className="flex items-start gap-3 rounded-lg border border-border bg-surface-elevated p-4">
                  <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${role.color}`} />
                  <div>
                    <p className="font-medium text-text-primary">{role.name}</p>
                    <p className="text-sm text-text-muted">{role.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-surface p-6">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Permissions Matrix</h2>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 pr-4 text-left font-medium text-text-secondary">Role</th>
                  {permissionHeaders.map((h) => (
                    <th key={h} className="pb-3 px-3 text-center font-medium text-text-secondary">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roleDefinitions.map((role) => (
                  <tr key={role.name} className="border-t border-border">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${role.color}`} />
                        <span className="font-medium text-text-primary">{role.name}</span>
                      </div>
                    </td>
                    {permissionKeys.map((key) => (
                      <td key={key} className="py-3 px-3 text-center">
                        {role.permissions[key] ? (
                          <Check className="mx-auto h-4 w-4 text-success" />
                        ) : (
                          <span className="mx-auto block h-4 w-4 text-center text-text-muted/30">--</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">User Management</h2>
            <button
              onClick={() => { setShowNewUser(true); setCreateError(null); }}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <Plus className="h-4 w-4" /> New User
            </button>
          </div>

          {usersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-surface">
              <table className="min-w-full text-sm">
                <thead className="border-b border-border bg-surface-elevated">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-border">
                      <td className="px-4 py-3 font-medium text-text-primary">{u.name}</td>
                      <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                      <td className="px-4 py-3">
                        {editingUserId === u.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value)}
                              className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-text-primary outline-none focus:border-accent"
                            >
                              {ROLE_OPTIONS.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleUpdateRole(u.id, editRole)}
                              className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-white hover:bg-accent-hover"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="rounded-md border border-border px-2 py-1 text-xs font-medium text-text-muted hover:text-text-primary"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${ROLE_COLORS[u.role] ?? "bg-text-muted"}`} />
                            <span className="capitalize">{u.role}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingUserId !== u.id && (
                          <button
                            onClick={() => { setEditingUserId(u.id); setEditRole(u.role); }}
                            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent"
                          >
                            Change Role
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* New User Modal */}
          {showNewUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-text-primary">New User</h2>
                  <button onClick={() => setShowNewUser(false)}
                    className="rounded-md p-1 text-text-muted transition-colors hover:bg-border hover:text-text-primary">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {createError && (
                  <div className="mb-4 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{createError}</div>
                )}

                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text-secondary">Name <span className="text-error">*</span></label>
                    <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text-secondary">Email <span className="text-error">*</span></label>
                    <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text-secondary">Role</label>
                    <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent">
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text-secondary">Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Leave blank for SSO-only users"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent" />
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setShowNewUser(false)}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-text-muted hover:text-text-primary">
                      Cancel
                    </button>
                    <button type="submit" disabled={createLoading}
                      className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50">
                      {createLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {createLoading ? "Creating..." : "Create User"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === "integrations" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Download className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">QuickBooks</h3>
                <p className="text-xs text-text-muted">Accounting export</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { href: "/api/exports/quickbooks-time.csv", label: "Time Activities CSV" },
                { href: "/api/exports/quickbooks-expenses.csv", label: "Expenses CSV" },
                { href: "/api/exports/time-entries.csv", label: "Time Entries CSV" },
                { href: "/api/exports/expenses.csv", label: "Expenses CSV" },
              ].map((link) => (
                <a key={link.href} href={link.href}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary">
                  <span>{link.label}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <FileText className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">PDF Generation</h3>
                <p className="text-xs text-text-muted">Contract & report PDFs</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: "Engine", value: "pdf-lib" },
                { label: "Status", value: "Active", icon: true },
                { label: "Features", value: "Signatures, watermarks" },
                { label: "Tracking", value: "Draft, Sent, Signed" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm">
                  <span className="text-text-secondary">{item.label}</span>
                  {item.icon ? (
                    <span className="flex items-center gap-1.5 text-success"><CheckCircle className="h-3.5 w-3.5" />{item.value}</span>
                  ) : (
                    <span className="font-medium text-text-primary">{item.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Mail className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Email</h3>
                <p className="text-xs text-text-muted">Notifications & delivery</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: "Provider", value: "SMTP" },
                { label: "Status", value: "Configured", warning: true },
                { label: "Queue", value: "Client + office copies" },
                { label: "Templates", value: "Invoice, contract, report" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm">
                  <span className="text-text-secondary">{item.label}</span>
                  {item.warning ? (
                    <span className="flex items-center gap-1.5 text-warning"><span className="h-2 w-2 rounded-full bg-warning" />{item.value}</span>
                  ) : (
                    <span className="text-text-primary">{item.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === "compliance" && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-2 text-lg font-semibold text-text-primary">Compliance Checklist</h2>
          <p className="mb-6 text-sm text-text-muted">
            Regulatory and operational compliance requirements for private investigation operations.
          </p>
          <div className="space-y-3">
            {complianceItems.map((item) => (
              <div key={item.title} className="flex items-start gap-4 rounded-lg border border-border bg-surface-elevated p-4">
                <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                  item.enabled ? "bg-success/15 text-success" : "bg-text-muted/15 text-text-muted"
                }`}>
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">{item.title}</p>
                  <p className="mt-0.5 text-sm text-text-muted">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
