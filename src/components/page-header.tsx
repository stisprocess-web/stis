/**
 * @module components/page-header
 * Consistent page header with title and description.
 */

interface PageHeaderProps {
  /** Page title. */
  title: string;
  /** Short description below the title. */
  description: string;
}

/** Standard page header used across all authenticated pages. */
export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        {title}
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </header>
  );
}
