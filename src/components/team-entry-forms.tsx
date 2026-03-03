/**
 * @module components/team-entry-forms
 * Client-side forms for adding time entries and expenses.
 */

"use client";

import { useState } from "react";

/** Shared input field styling. */
const inputClass =
  "rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600";

/** Shared button styling. */
const buttonClass =
  "mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200";

/** Status message component. */
function StatusMessage({ message, isError }: { message: string; isError?: boolean }) {
  if (!message) return null;
  return (
    <p
      className={`mt-2 rounded-lg border p-2 text-xs ${
        isError
          ? "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
          : "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
      }`}
    >
      {message}
    </p>
  );
}

/** Side-by-side forms for time entry and expense submission. */
export function TeamEntryForms() {
  const [timeMsg, setTimeMsg] = useState("");
  const [timeError, setTimeError] = useState(false);
  const [timeLoading, setTimeLoading] = useState(false);
  const [expenseMsg, setExpenseMsg] = useState("");
  const [expenseError, setExpenseError] = useState(false);
  const [expenseLoading, setExpenseLoading] = useState(false);

  async function submitTime(formData: FormData) {
    setTimeMsg("");
    setTimeError(false);
    setTimeLoading(true);

    try {
      const payload = {
        caseId: String(formData.get("caseId") || ""),
        contractorId: String(formData.get("contractorId") || ""),
        workDate: String(formData.get("workDate") || ""),
        hours: Number(formData.get("hours") || 0),
        billableAmountUsd: Number(formData.get("billableAmountUsd") || 0),
        notes: String(formData.get("notes") || ""),
      };

      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setTimeMsg("Time entry saved successfully.");
      } else {
        const data = await res.json().catch(() => ({}));
        setTimeMsg(data.error?.formErrors?.[0] || "Failed to save time entry.");
        setTimeError(true);
      }
    } catch {
      setTimeMsg("Network error. Please try again.");
      setTimeError(true);
    } finally {
      setTimeLoading(false);
    }
  }

  async function submitExpense(formData: FormData) {
    setExpenseMsg("");
    setExpenseError(false);
    setExpenseLoading(true);

    try {
      const payload = {
        caseId: String(formData.get("caseId") || ""),
        contractorId: String(formData.get("contractorId") || ""),
        spentDate: String(formData.get("spentDate") || ""),
        category: String(formData.get("category") || "Other"),
        amountUsd: Number(formData.get("amountUsd") || 0),
        notes: String(formData.get("notes") || ""),
      };

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setExpenseMsg("Expense saved successfully.");
      } else {
        const data = await res.json().catch(() => ({}));
        setExpenseMsg(data.error?.formErrors?.[0] || "Failed to save expense.");
        setExpenseError(true);
      }
    } catch {
      setExpenseMsg("Network error. Please try again.");
      setExpenseError(true);
    } finally {
      setExpenseLoading(false);
    }
  }

  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-2">
      <form
        action={submitTime}
        className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-zinc-900"
      >
        <h3 className="mb-4 text-lg font-semibold">Add Time Entry</h3>
        <div className="grid gap-3">
          <input name="caseId" placeholder="Case ID (e.g. ca2)" className={inputClass} required />
          <input name="contractorId" placeholder="Contractor ID (e.g. ct1)" className={inputClass} required />
          <input type="date" name="workDate" className={inputClass} required />
          <input type="number" step="0.25" min="0.25" name="hours" placeholder="Hours" className={inputClass} required />
          <input type="number" step="0.01" min="0" name="billableAmountUsd" placeholder="Billable Amount ($)" className={inputClass} required />
          <input name="notes" placeholder="Notes (optional)" className={inputClass} />
        </div>
        <button type="submit" disabled={timeLoading} className={buttonClass}>
          {timeLoading ? "Saving…" : "Save Time Entry"}
        </button>
        <StatusMessage message={timeMsg} isError={timeError} />
      </form>

      <form
        action={submitExpense}
        className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-zinc-900"
      >
        <h3 className="mb-4 text-lg font-semibold">Add Expense</h3>
        <div className="grid gap-3">
          <input name="caseId" placeholder="Case ID (e.g. ca2)" className={inputClass} required />
          <input name="contractorId" placeholder="Contractor ID (e.g. ct1)" className={inputClass} required />
          <input type="date" name="spentDate" className={inputClass} required />
          <select name="category" className={inputClass}>
            <option>Mileage</option>
            <option>Lodging</option>
            <option>Meals</option>
            <option>Equipment</option>
            <option>Other</option>
          </select>
          <input type="number" step="0.01" min="0.01" name="amountUsd" placeholder="Amount ($)" className={inputClass} required />
          <input name="notes" placeholder="Notes (optional)" className={inputClass} />
        </div>
        <button type="submit" disabled={expenseLoading} className={buttonClass}>
          {expenseLoading ? "Saving…" : "Save Expense"}
        </button>
        <StatusMessage message={expenseMsg} isError={expenseError} />
      </form>
    </section>
  );
}
