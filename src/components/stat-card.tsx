/**
 * @module components/stat-card
 * Reusable KPI card for dashboards and reporting pages.
 */

/** Props for the StatCard component. */
interface StatCardProps {
  /** Label displayed above the value. */
  label: string;
  /** Primary value to display. */
  value: string;
  /** Optional hint text below the value. */
  hint?: string;
}

/** A single KPI metric card with label, large value, and optional hint. */
export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
