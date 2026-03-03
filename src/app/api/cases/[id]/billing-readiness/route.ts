/**
 * @module api/cases/[id]/billing-readiness
 * GET /api/cases/:id/billing-readiness — Check if a case is ready for invoicing.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    const c = await prisma.case.findUnique({
      where: { id },
      include: {
        timeEntries: true,
        expenses: true,
        invoices: true,
        tasks: true,
      },
    });

    if (!c) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const openTasks = c.tasks.filter((t) => !t.done).length;
    const unapprovedExpenses = c.expenses.filter(
      (e) => e.status !== "APPROVED" && e.status !== "REIMBURSED",
    ).length;
    const hasTime = c.timeEntries.length > 0;
    const draftInvoices = c.invoices.filter((i) => i.status === "DRAFT").length;

    return NextResponse.json({
      caseId: c.id,
      caseCode: c.caseCode,
      ready: openTasks === 0 && unapprovedExpenses === 0 && hasTime,
      checks: { openTasks, unapprovedExpenses, hasTime, draftInvoices },
    });
  } catch (error) {
    console.error("Failed to check billing readiness:", error);
    return NextResponse.json({ error: "Failed to check billing readiness" }, { status: 500 });
  }
}
