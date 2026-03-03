/**
 * @module lib/data
 * Database query functions for page-level data fetching.
 *
 * All pages should use these functions instead of direct Prisma calls
 * for consistent error handling and type safety.
 */

import { prisma } from "@/lib/prisma";

/* ── Dashboard ─────────────────────────────────────────────────────── */

/** Fetch KPIs and summary data for the main dashboard. */
export async function getDashboardData() {
  const [cases, tasks, evidenceCount, invoices] = await Promise.all([
    prisma.case.findMany({ orderBy: { priority: "desc" }, take: 10, include: { client: true } }),
    prisma.task.findMany({ where: { done: false }, orderBy: { dueDate: "asc" }, take: 10, include: { case: true } }),
    prisma.evidence.count(),
    prisma.invoice.findMany({ orderBy: { issuedDate: "desc" }, take: 10, include: { client: true } }),
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

/** Fetch all cases with client info for the cases list page. */
export async function getCases() {
  return prisma.case.findMany({
    include: { client: true },
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
  });
}

/* ── Clients ───────────────────────────────────────────────────────── */

/** Fetch all clients for the clients list page. */
export async function getClients() {
  return prisma.client.findMany({ orderBy: { name: "asc" } });
}

/* ── Evidence ──────────────────────────────────────────────────────── */

/** Fetch all evidence items with case info. */
export async function getEvidenceItems() {
  return prisma.evidence.findMany({
    include: { case: true, uploadedBy: true },
    orderBy: { uploadedAt: "desc" },
  });
}

/* ── Tasks ─────────────────────────────────────────────────────────── */

/** Fetch all tasks with case info. */
export async function getTasks() {
  return prisma.task.findMany({
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
