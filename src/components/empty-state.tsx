/**
 * @module components/empty-state
 * Placeholder shown when a list or table has no data.
 */

interface EmptyStateProps {
  /** Title text (e.g. "No cases found"). */
  title: string;
  /** Optional description below the title. */
  description?: string;
}

/** Empty state placeholder with centered icon, title, and description. */
export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-black/10 bg-white/50 px-6 py-12 text-center dark:border-white/10 dark:bg-zinc-900/50">
      <div className="mb-3 text-3xl text-zinc-300 dark:text-zinc-600">📭</div>
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-zinc-500">{description}</p>
      )}
    </div>
  );
}
