"use client";

/**
 * @module components/team-entry-forms
 * Client-side forms for adding time entries and expenses.
 * Dark theme styled with bg-surface-elevated, border-border, text-text-primary.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Receipt, Loader2, CheckCheck, AlertCircle } from "lucide-react";

/* ── Feedback state type ───────────────────────────────────────────── */

type FeedbackState = { type: "success" | "error"; message: string } | null;

/** Inline feedback message. */
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

/* ── Shared classes ────────────────────────────────────────────────── */

const inputClass =
  "w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent";

const labelClass = "mb-1.5 block text-sm font-medium text-text-secondary";

/* ── Component ─────────────────────────────────────────────────────── */

/** Side-by-side forms for time entry and expense submission. */
export function TeamEntryForms() {
  const router = useRouter();

  /* Time entry state */
  const [timeFeedback, setTimeFeedback] = useState<FeedbackState>(null);
  const [timeLoading, setTimeLoading] = useState(false);
  const [timeCaseId, setTimeCaseId] = useState("");
  const [timeContractorId, setTimeContractorId] = useState("");
  const [timeWorkDate, setTimeWorkDate] = useState("");
  const [timeHours, setTimeHours] = useState("");
  const [timeBillable, setTimeBillable] = useState("");
  const [timeNotes, setTimeNotes] = useState("");

  /* Expense state */
  const [expenseFeedback, setExpenseFeedback] = useState<FeedbackState>(null);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseCaseId, setExpenseCaseId] = useState("");
  const [expenseContractorId, setExpenseContractorId] = useState("");
  const [expenseSpentDate, setExpenseSpentDate] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Mileage");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");

  /* ── Handlers ────────────────────────────────────────────────────── */

  async function submitTime(e: React.FormEvent) {
    e.preventDefault();
    setTimeFeedback(null);
    setTimeLoading(true);

    try {
      const payload = {
        caseId: timeCaseId,
        contractorId: timeContractorId,
        workDate: timeWorkDate,
        hours: Number(timeHours),
        billableAmountUsd: Number(timeBillable),
        notes: timeNotes || undefined,
      };

      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setTimeFeedback({ type: "success", message: "Time entry saved successfully." });
        setTimeCaseId("");
        setTimeContractorId("");
        setTimeWorkDate("");
        setTimeHours("");
        setTimeBillable("");
        setTimeNotes("");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error?.formErrors?.[0] ||
            (typeof data.error === "string" ? data.error : "Failed to save time entry.")
        );
      }
    } catch (err) {
      setTimeFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Network error. Please try again.",
      });
    } finally {
      setTimeLoading(false);
    }
  }

  async function submitExpense(e: React.FormEvent) {
    e.preventDefault();
    setExpenseFeedback(null);
    setExpenseLoading(true);

    try {
      const payload = {
        caseId: expenseCaseId,
        contractorId: expenseContractorId,
        spentDate: expenseSpentDate,
        category: expenseCategory,
        amountUsd: Number(expenseAmount),
        notes: expenseNotes || undefined,
      };

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setExpenseFeedback({ type: "success", message: "Expense saved successfully." });
        setExpenseCaseId("");
        setExpenseContractorId("");
        setExpenseSpentDate("");
        setExpenseCategory("Mileage");
        setExpenseAmount("");
        setExpenseNotes("");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error?.formErrors?.[0] ||
            (typeof data.error === "string" ? data.error : "Failed to save expense.")
        );
      }
    } catch (err) {
      setExpenseFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Network error. Please try again.",
      });
    } finally {
      setExpenseLoading(false);
    }
  }

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {/* Log Time Entry */}
      <form
        onSubmit={submitTime}
        className="rounded-xl border border-border bg-surface p-5"
      >
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-text-primary">Log Time Entry</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label htmlFor="te-caseId" className={labelClass}>
              Case ID <span className="text-error">*</span>
            </label>
            <input
              id="te-caseId"
              required
              value={timeCaseId}
              onChange={(e) => setTimeCaseId(e.target.value)}
              placeholder="e.g. ca2"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="te-contractorId" className={labelClass}>
              Contractor ID <span className="text-error">*</span>
            </label>
            <input
              id="te-contractorId"
              required
              value={timeContractorId}
              onChange={(e) => setTimeContractorId(e.target.value)}
              placeholder="e.g. ct1"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="te-workDate" className={labelClass}>
                Work Date <span className="text-error">*</span>
              </label>
              <input
                id="te-workDate"
                type="date"
                required
                value={timeWorkDate}
                onChange={(e) => setTimeWorkDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="te-hours" className={labelClass}>
                Hours <span className="text-error">*</span>
              </label>
              <input
                id="te-hours"
                type="number"
                step="0.25"
                min="0.25"
                required
                value={timeHours}
                onChange={(e) => setTimeHours(e.target.value)}
                placeholder="0"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="te-billable" className={labelClass}>
              Billable Amount ($) <span className="text-error">*</span>
            </label>
            <input
              id="te-billable"
              type="number"
              step="0.01"
              min="0"
              required
              value={timeBillable}
              onChange={(e) => setTimeBillable(e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="te-notes" className={labelClass}>
              Notes
            </label>
            <input
              id="te-notes"
              value={timeNotes}
              onChange={(e) => setTimeNotes(e.target.value)}
              placeholder="Optional notes"
              className={inputClass}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={timeLoading}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {timeLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {timeLoading ? "Saving..." : "Save Time Entry"}
        </button>
        <Feedback state={timeFeedback} />
      </form>

      {/* Log Expense */}
      <form
        onSubmit={submitExpense}
        className="rounded-xl border border-border bg-surface p-5"
      >
        <div className="mb-4 flex items-center gap-2">
          <Receipt className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-text-primary">Log Expense</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label htmlFor="ex-caseId" className={labelClass}>
              Case ID <span className="text-error">*</span>
            </label>
            <input
              id="ex-caseId"
              required
              value={expenseCaseId}
              onChange={(e) => setExpenseCaseId(e.target.value)}
              placeholder="e.g. ca2"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ex-contractorId" className={labelClass}>
              Contractor ID <span className="text-error">*</span>
            </label>
            <input
              id="ex-contractorId"
              required
              value={expenseContractorId}
              onChange={(e) => setExpenseContractorId(e.target.value)}
              placeholder="e.g. ct1"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ex-spentDate" className={labelClass}>
                Spent Date <span className="text-error">*</span>
              </label>
              <input
                id="ex-spentDate"
                type="date"
                required
                value={expenseSpentDate}
                onChange={(e) => setExpenseSpentDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="ex-category" className={labelClass}>
                Category <span className="text-error">*</span>
              </label>
              <select
                id="ex-category"
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className={inputClass}
              >
                <option>Mileage</option>
                <option>Lodging</option>
                <option>Meals</option>
                <option>Equipment</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="ex-amount" className={labelClass}>
              Amount ($) <span className="text-error">*</span>
            </label>
            <input
              id="ex-amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ex-notes" className={labelClass}>
              Notes
            </label>
            <input
              id="ex-notes"
              value={expenseNotes}
              onChange={(e) => setExpenseNotes(e.target.value)}
              placeholder="Optional notes"
              className={inputClass}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={expenseLoading}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {expenseLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {expenseLoading ? "Saving..." : "Save Expense"}
        </button>
        <Feedback state={expenseFeedback} />
      </form>
    </section>
  );
}
