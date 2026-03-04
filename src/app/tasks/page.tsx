/**
 * @module app/tasks/page
 * Tasks page -- server component wrapper that fetches data
 * and delegates to the interactive TasksClient component.
 *
 * Role-aware: investigators see only tasks on assigned cases.
 */

import { TasksClient } from "@/components/tasks-client";
import { getTasks, getCases } from "@/lib/data";
import { getRoleContext } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const ctx = await getRoleContext();

  const [tasks, cases] = await Promise.all([
    getTasks(ctx).catch(() => []),
    getCases(ctx).catch(() => []),
  ]);

  // Serialize dates for client component
  const serializedTasks = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    owner: t.owner,
    done: t.done,
    dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null,
    caseCode: t.case.caseCode,
    caseId: t.caseId,
  }));

  const serializedCases = cases.map((c) => ({
    id: c.id,
    caseCode: c.caseCode,
    title: c.title,
  }));

  return <TasksClient tasks={serializedTasks} cases={serializedCases} />;
}
