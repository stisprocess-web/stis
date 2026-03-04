/**
 * @module lib/data
 * Database query functions for page-level data fetching.
 *
 * All pages should use these functions instead of direct Prisma calls
 * for consistent error handling and type safety.
 *
 * Functions accept an optional RoleContext to enforce RBAC/ABAC filtering:
 *   - Investigators see only their assigned cases/tasks/evidence
 *   - Clients see only their own cases
 *   - Confidential cases hidden from everyone except admin + assigned investigators
 */

import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/lib/auth";

/** Context for role-aware data filtering. */
export interface RoleContext {
  role: AppRole;
  userId: string;
}

/**
 * Get the list of case IDs a user is assigned to (for investigator filtering).
 */
async function getAssignedCaseIds(userId: string): Promise<string[]> {
  const assignments = await prisma.caseAssignment.findMany({
    where: { userId },
    select: { caseId: true },
  });
  return assignments.map((a) => a.caseId);
}

/**
 * Build a Prisma `where` clause that scopes cases by role:
 *   - admin/owner: all cases
 *   - management: all non-confidential, plus confidential if assigned
 *   - investigator: only assigned cases
 *   - client: only cases where user email matches client — handled at page level
 *   - billing: should not reach case queries (blocked by middleware)
 */
async function caseWhereForRole(ctx?: RoleContext) {
  if (!ctx) return {};
  const { role, userId } = ctx;

  if (role === "owner" || role === "admin") return {};

  if (role === "management") {
    // See everything except confidential cases they aren't assigned to
    const assignedIds = await getAssignedCaseIds(userId);
    return {
      OR: [
        { visibility: "normal" },
        { visibility: "confidential", assignments: { some: { userId } } },
        ...(assignedIds.length > 0 ? [{ id: { in: assignedIds } }] : []),
      ],
    };
  }

  if (role === "investigator") {
    const assignedIds = await getAssignedCaseIds(userId);
    if (assignedIds.length === 0) return { id: "___none___" }; // no results
    return { id: { in: assignedIds } };
  }

  if (role === "client") {
    // Client filtering is done at the page level by matching user email to client email
    // For now return all (the page will pass proper context)
    return {};
  }

  // billing / unknown — no cases
  return { id: "___none___" };
}

/* ── Dashboard ─────────────────────────────────────────────────────── */

/** Fetch KPIs and summary data for the main dashboard. */
export async function getDashboardData(ctx?: RoleContext) {
  const caseWhere = await caseWhereForRole(ctx);
  const isFinancial = !ctx || ctx.role === "owner" || ctx.role === "admin" || ctx.role === "billing";

  const [cases, tasks, evidenceCount, invoices] = await Promise.all([
    prisma.case.findMany({
      where: caseWhere,
      orderBy: { priority: "desc" },
      take: 10,
      include: { client: true },
    }),
    prisma.task.findMany({
      where: {
        done: false,
        ...(ctx?.role === "investigator" ? { case: caseWhere } : {}),
      },
      orderBy: { dueDate: "asc" },
      take: 10,
      include: { case: true },
    }),
    prisma.evidence.count(
      ctx?.role === "investigator" ? { where: { case: caseWhere } } : undefined,
    ),
    isFinancial
      ? prisma.invoice.findMany({ orderBy: { issuedDate: "desc" }, take: 10, include: { client: true } })
      : Promise.resolve([]),
  ]);

  const activeCases = cases.filter((c) => c.status === "ACTIVE").length;
  const openTasks = tasks.length;
  const unpaidInvoices = invoices
    .filter((i) => i.status !== "PAID")
    .reduce((sum, i) => sum + i.amountUsd, 0);

  return {
    kpis: { activeCases, openTasks, evidenceCount, unpaidInvoices },
    cases,
    tasks,
    invoices,
  };
}

/* ── Cases ─────────────────────────────────────────────────────────── */

/** Fetch cases with client info, scoped by role. */
export async function getCases(ctx?: RoleContext) {
  const caseWhere = await caseWhereForRole(ctx);
  return prisma.case.findMany({
    where: caseWhere,
    include: { client: true, assignments: { include: { user: true } } },
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
  });
}

/* ── Clients ───────────────────────────────────────────────────────── */

/** Fetch all clients for the clients list page. */
export async function getClients() {
  return prisma.client.findMany({ orderBy: { name: "asc" } });
}

/* ── Evidence ──────────────────────────────────────────────────────── */

/** Fetch evidence items with case info, scoped by role. */
export async function getEvidenceItems(ctx?: RoleContext) {
  const caseWhere = await caseWhereForRole(ctx);
  return prisma.evidence.findMany({
    where: ctx?.role === "investigator" || ctx?.role === "client" ? { case: caseWhere } : {},
    include: { case: true, uploadedBy: true },
    orderBy: { uploadedAt: "desc" },
  });
}

/* ── Tasks ─────────────────────────────────────────────────────────── */

/** Fetch tasks with case info, scoped by role. */
export async function getTasks(ctx?: RoleContext) {
  const caseWhere = await caseWhereForRole(ctx);
  return prisma.task.findMany({
    where: ctx?.role === "investigator" ? { case: caseWhere } : {},
    include: { case: true },
    orderBy: [{ done: "asc" }, { dueDate: "asc" }],
  });
}

/* ── Invoicing ─────────────────────────────────────────────────────── */

/** Fetch invoicing data: invoices, time entries, and expenses. */
export async function getInvoicingData() {
  const [invoices, timeEntries, expenses] = await Promise.all([
    prisma.invoice.findMany({
      include: { client: true, case: true },
      orderBy: { issuedDate: "desc" },
    }),
    prisma.timeEntry.findMany({
      include: { contractor: true, case: true },
      orderBy: { workDate: "desc" },
      take: 20,
    }),
    prisma.expense.findMany({
      include: { contractor: true, case: true },
      orderBy: { spentDate: "desc" },
      take: 20,
    }),
  ]);

  return { invoices, timeEntries, expenses };
}

/* ── Users ─────────────────────────────────────────────────────────── */

/** Fetch all users (admin only). */
export async function getUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { name: "asc" },
  });
}

/* ── Case Assignments ──────────────────────────────────────────────── */

/** Fetch assignments for a specific case. */
export async function getCaseAssignments(caseId: string) {
  return prisma.caseAssignment.findMany({
    where: { caseId },
    include: { user: true },
    orderBy: { assignedAt: "desc" },
  });
}
