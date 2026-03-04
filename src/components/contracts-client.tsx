"use client";

/**
 * @module components/contracts-client
 * Interactive contracts page with create, send, mark-signed forms
 * and a contract queue table.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Send,
  CheckCircle,
  Loader2,
  AlertCircle,
  CheckCheck,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";

/* ── Types ──────────────────────────────────────────────────────────── */

interface SerializedContract {
  id: string;
  caseCode: string;
  clientName: string;
  clientEmail: string;
  templateName: string;
  status: string;
  pdfPath: string | null;
  sentAt: string | null;
  signedAt: string | null;
  retainerAmount: string | null;
  hourlyRate: string | null;
  createdAt: string | null;
}

interface ContractsClientProps {
  contracts: SerializedContract[];
}

type FeedbackState = { type: "success" | "error"; message: string } | null;

/* ── Component ──────────────────────────────────────────────────────── */

export function ContractsClient({ contracts }: ContractsClientProps) {
  const router = useRouter();

  /* Create form state */
  const [createLoading, setCreateLoading] = useState(false);
  const [createFeedback, setCreateFeedback] = useState<FeedbackState>(null);
  const [caseCode, setCaseCode] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [templateName, setTemplateName] = useState("standard-retainer");
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [retainerAmount, setRetainerAmount] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");

  /* Send form state */
  const [sendContractId, setSendContractId] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [sendFeedback, setSendFeedback] = useState<FeedbackState>(null);

  /* Sign form state */
  const [signContractId, setSignContractId] = useState("");
  const [officeEmail, setOfficeEmail] = useState("");
  const [signLoading, setSignLoading] = useState(false);
  const [signFeedback, setSignFeedback] = useState<FeedbackState>(null);

  /* Derived lists */
  const unsentContracts = contracts.filter((c) => c.status === "draft");
  const sentContracts = contracts.filter((c) => c.status === "sent");

  /* ── Handlers ────────────────────────────────────────────────────── */

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateFeedback(null);

    try {
      const formData = new FormData();
      formData.append("caseCode", caseCode);
      formData.append("clientName", clientName);
      formData.append("clientEmail", clientEmail);
      formData.append("templateName", templateName);
      if (scopeOfWork) formData.append("scopeOfWork", scopeOfWork);
      if (retainerAmount) formData.append("retainerAmount", retainerAmount);
      if (hourlyRate) formData.append("hourlyRate", hourlyRate);

      const res = await fetch("/api/contracts/create", {
        method: "POST",
        body: formData,
        redirect: "manual",
      });

      // The API returns a redirect on success (3xx) or an error (4xx/5xx)
      if (res.type === "opaqueredirect" || res.status === 0 || (res.status >= 300 && res.status < 400)) {
        setCreateFeedback({ type: "success", message: "Contract created and PDF generated successfully." });
        setCaseCode("");
        setClientName("");
        setClientEmail("");
        setTemplateName("standard-retainer");
        setScopeOfWork("");
        setRetainerAmount("");
        setHourlyRate("");
        router.refresh();
      } else if (res.ok) {
        // If the API returns JSON (possible future change)
        setCreateFeedback({ type: "success", message: "Contract created and PDF generated successfully." });
        setCaseCode("");
        setClientName("");
        setClientEmail("");
        setTemplateName("standard-retainer");
        setScopeOfWork("");
        setRetainerAmount("");
        setHourlyRate("");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(typeof data.error === "string" ? data.error : "Failed to create contract");
      }
    } catch (err) {
      setCreateFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "An unexpected error occurred",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendLoading(true);
    setSendFeedback(null);

    try {
      const formData = new FormData();
      formData.append("contractId", sendContractId);

      const res = await fetch("/api/contracts/send", {
        method: "POST",
        body: formData,
        redirect: "manual",
      });

      if (res.type === "opaqueredirect" || res.status === 0 || (res.status >= 300 && res.status < 400)) {
        setSendFeedback({ type: "success", message: "Contract marked as sent." });
        setSendContractId("");
        router.refresh();
      } else if (res.ok) {
        setSendFeedback({ type: "success", message: "Contract marked as sent." });
        setSendContractId("");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(typeof data.error === "string" ? data.error : "Failed to send contract");
      }
    } catch (err) {
      setSendFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "An unexpected error occurred",
      });
    } finally {
      setSendLoading(false);
    }
  };

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignLoading(true);
    setSignFeedback(null);

    try {
      const formData = new FormData();
      formData.append("contractId", signContractId);
      formData.append("officeEmail", officeEmail);

      const res = await fetch("/api/contracts/mark-signed", {
        method: "POST",
        body: formData,
        redirect: "manual",
      });

      if (res.type === "opaqueredirect" || res.status === 0 || (res.status >= 300 && res.status < 400)) {
        setSignFeedback({ type: "success", message: "Contract marked as signed. Email notifications queued." });
        setSignContractId("");
        setOfficeEmail("");
        router.refresh();
      } else if (res.ok) {
        setSignFeedback({ type: "success", message: "Contract marked as signed. Email notifications queued." });
        setSignContractId("");
        setOfficeEmail("");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(typeof data.error === "string" ? data.error : "Failed to mark contract as signed");
      }
    } catch (err) {
      setSignFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "An unexpected error occurred",
      });
    } finally {
      setSignLoading(false);
    }
  };

  /* ── Feedback helper ─────────────────────────────────────────────── */

  function Feedback({ state }: { state: FeedbackState }) {
    if (!state) return null;
    return (
      <div
        className={`mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
          state.type === "success"
            ? "border-success/30 bg-success/10 text-success"
            : "border-error/30 bg-error/10 text-error"
        }`}
      >
        {state.type === "success" ? (
          <CheckCheck className="h-4 w-4 shrink-0" />
        ) : (
          <AlertCircle className="h-4 w-4 shrink-0" />
        )}
        {state.message}
      </div>
    );
  }

  /* ── Input class ─────────────────────────────────────────────────── */

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent";

  const labelClass = "mb-1.5 block text-sm font-medium text-text-secondary";

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <div>
      <PageHeader
        title="Contracts"
        description="Create contract PDFs with signature blocks, track signing status, store signed copies, and email completions."
      />

      {/* Action Cards */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {/* Card 1: Create Contract & Generate PDF */}
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-border bg-surface p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-text-primary">Create Contract & Generate PDF</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label htmlFor="create-caseCode" className={labelClass}>
                Case Code <span className="text-error">*</span>
              </label>
              <input
                id="create-caseCode"
                required
                value={caseCode}
                onChange={(e) => setCaseCode(e.target.value)}
                placeholder="e.g. C-1001"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="create-clientName" className={labelClass}>
                Client Name <span className="text-error">*</span>
              </label>
              <input
                id="create-clientName"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Full name"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="create-clientEmail" className={labelClass}>
                Client Email <span className="text-error">*</span>
              </label>
              <input
                id="create-clientEmail"
                type="email"
                required
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="create-template" className={labelClass}>
                Template <span className="text-error">*</span>
              </label>
              <select
                id="create-template"
                required
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className={inputClass}
              >
                <option value="standard-retainer">Standard Retainer</option>
                <option value="flat-fee">Flat Fee</option>
              </select>
            </div>
            <div>
              <label htmlFor="create-scope" className={labelClass}>
                Scope of Work
              </label>
              <textarea
                id="create-scope"
                value={scopeOfWork}
                onChange={(e) => setScopeOfWork(e.target.value)}
                placeholder="Describe the scope (optional - uses default)"
                rows={3}
                className={inputClass + " resize-none"}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="create-retainer" className={labelClass}>
                  Retainer ($)
                </label>
                <input
                  id="create-retainer"
                  value={retainerAmount}
                  onChange={(e) => setRetainerAmount(e.target.value)}
                  placeholder="5,000.00"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="create-rate" className={labelClass}>
                  Hourly Rate ($)
                </label>
                <input
                  id="create-rate"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="125.00"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={createLoading}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {createLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {createLoading ? "Generating..." : "Create Contract & Generate PDF"}
          </button>
          <Feedback state={createFeedback} />
        </form>

        {/* Card 2: Send for Signature */}
        <form
          onSubmit={handleSend}
          className="flex flex-col rounded-xl border border-border bg-surface p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <Send className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-text-primary">Send for Signature</h2>
          </div>
          <p className="mb-4 text-sm text-text-muted">
            Mark a draft contract as sent. The generated PDF can be printed, emailed, or delivered for wet signature.
          </p>
          <div className="flex-1">
            <label htmlFor="send-contract" className={labelClass}>
              Contract <span className="text-error">*</span>
            </label>
            {unsentContracts.length === 0 ? (
              <p className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-muted">
                No draft contracts available.
              </p>
            ) : (
              <select
                id="send-contract"
                required
                value={sendContractId}
                onChange={(e) => setSendContractId(e.target.value)}
                className={inputClass}
              >
                <option value="">Select a contract...</option>
                {unsentContracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} - {c.clientName} ({c.caseCode})
                  </option>
                ))}
              </select>
            )}
          </div>
          <button
            type="submit"
            disabled={sendLoading || unsentContracts.length === 0}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {sendLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {sendLoading ? "Sending..." : "Mark as Sent"}
          </button>
          <Feedback state={sendFeedback} />
        </form>

        {/* Card 3: Mark as Signed */}
        <form
          onSubmit={handleSign}
          className="flex flex-col rounded-xl border border-border bg-surface p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <h2 className="text-lg font-semibold text-text-primary">Mark as Signed</h2>
          </div>
          <p className="mb-4 text-sm text-text-muted">
            Record a signed contract and queue email notifications to client and office.
          </p>
          <div className="flex-1 space-y-3">
            <div>
              <label htmlFor="sign-contract" className={labelClass}>
                Contract <span className="text-error">*</span>
              </label>
              {sentContracts.length === 0 ? (
                <p className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-muted">
                  No sent contracts available.
                </p>
              ) : (
                <select
                  id="sign-contract"
                  required
                  value={signContractId}
                  onChange={(e) => setSignContractId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select a contract...</option>
                  {sentContracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} - {c.clientName} ({c.caseCode})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label htmlFor="sign-email" className={labelClass}>
                Office Email <span className="text-error">*</span>
              </label>
              <input
                id="sign-email"
                type="email"
                required
                value={officeEmail}
                onChange={(e) => setOfficeEmail(e.target.value)}
                placeholder="office@company.com"
                className={inputClass}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={signLoading || sentContracts.length === 0}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {signLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {signLoading ? "Processing..." : "Mark Signed & Queue Emails"}
          </button>
          <Feedback state={signFeedback} />
        </form>
      </div>

      {/* Contract Queue Table */}
      <section className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-text-primary">Contract Queue</h2>
        </div>
        {contracts.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No contracts" description="Create your first contract above." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-surface-elevated">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Case Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Template</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Retainer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Created</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-border transition-colors hover:bg-surface-elevated/50"
                  >
                    <td className="px-4 py-3 font-medium text-accent">{c.id}</td>
                    <td className="px-4 py-3 text-text-primary">{c.caseCode}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      <div>{c.clientName}</div>
                      <div className="text-xs text-text-muted">{c.clientEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{c.templateName}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {c.retainerAmount ? `$${c.retainerAmount}` : "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {c.hourlyRate ? `$${c.hourlyRate}/hr` : "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {c.signedAt
                        ? new Date(c.signedAt).toLocaleDateString()
                        : c.sentAt
                          ? new Date(c.sentAt).toLocaleDateString()
                          : c.createdAt
                            ? new Date(c.createdAt).toLocaleDateString()
                            : "\u2014"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
