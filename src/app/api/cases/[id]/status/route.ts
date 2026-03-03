/**
 * @module api/cases/[id]/status
 * PATCH /api/cases/:id/status — Transition case status with validation guards.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRoleFromRequest } from "@/lib/auth";
import { CaseStatusSchema } from "@/lib/validation";
import { roleAllowed, accessPolicy } from "@/lib/roles";
import type { CaseStatus } from "@prisma/client";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const role = await getRoleFromRequest(req);
    if (!roleAllowed(role, [...accessPolicy.caseManagement])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = CaseStatusSchema.safeParse({ status: String(body.status || "").toUpperCase() });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const nextStatus = parsed.data.status;

    const c = await prisma.case.findUnique({
      where: { id },
      include: {
        tasks: { where: { done: false } },
        evidenceItems: true,
        invoices: true,
      },
    });

    if (!c) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Business rule: ACTIVE requires title and client
    if (nextStatus === "ACTIVE" && (!c.title || !c.clientId)) {
      return NextResponse.json(
        { error: "Case must have a title and assigned client before activation" },
        { status: 400 },
      );
    }

    // Business rule: CLOSED requires all tasks done, evidence, and invoice
    if (nextStatus === "CLOSED") {
      if (c.tasks.length > 0) {
        return NextResponse.json({ error: "Cannot close case with open tasks" }, { status: 400 });
      }
      if (c.evidenceItems.length === 0) {
        return NextResponse.json({ error: "Cannot close case without logged evidence" }, { status: 400 });
      }
      const hasInvoice = c.invoices.some((i) => i.status === "SENT" || i.status === "PAID");
      if (!hasInvoice) {
        return NextResponse.json({ error: "Cannot close case without a sent or paid invoice" }, { status: 400 });
      }
    }

    const updated = await prisma.case.update({
      where: { id },
      data: { status: nextStatus as CaseStatus },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update case status:", error);
    return NextResponse.json({ error: "Failed to update case status" }, { status: 500 });
  }
}
