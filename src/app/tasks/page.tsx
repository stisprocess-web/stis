/**
 * @module app/tasks/page
 * Operations tasks — assignment, due dates, and completion tracking.
 */

import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { getTasks } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const tasks = await getTasks().catch(() => []);

  return (
    <div>
      <PageHeader title="Operations Tasks" description="Assign field work, due dates, and completion status." />
      <Nav />

      {tasks.length === 0 ? (
        <EmptyState title="No tasks found" description="Tasks will appear here once created." />
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <article
              key={t.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900"
            >
              <div>
                <h2 className="font-semibold">{t.title}</h2>
                <p className="text-xs text-zinc-500">
                  {t.case.caseCode} • {t.owner}
                  {t.dueDate ? ` • Due ${t.dueDate.toISOString().slice(0, 10)}` : ""}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  t.done
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                }`}
              >
                {t.done ? "Done" : "Open"}
              </span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
