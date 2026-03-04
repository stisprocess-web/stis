/**
 * @module api/time-entries
 * GET /api/time-entries — List time entries (role-filtered).
 * POST /api/time-entries — Create a new time entry.
 *
 * Time entries are visible to: the submitter, admin, and billing.
 * Investigators see only their own time entries.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canWriteTime, getSessionFromRequest, isAdmin, canViewFinancials } from "@/lib/auth";
import { CreateTimeEntrySchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Investigators only see their own time entries (matched via createdById)
    const where =
      session.role === "investigator"
        ? { createdById: session.userId }
        : {};

    const entries = await prisma.timeEntry.findMany({
      where,
      include: { contractor: true, case: true },
      orderBy: { workDate: "desc" },
    });

    // Strip billable amounts for non-financial roles
    if (!canViewFinancials(session.role)) {
      const stripped = entries.map(({ billableAmountUsd, ...rest }) => rest);
      return NextResponse.json(stripped);
    }

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Failed to fetch time entries:", error);
    return NextResponse.json({ error: "Failed to fetch time entries" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || !canWriteTime(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = CreateTimeEntrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Investigators can only submit time on assigned cases
    if (session.role === "investigator") {
      const assignment = await prisma.caseAssignment.findUnique({
        where: { caseId_userId: { caseId: parsed.data.caseId, userId: session.userId } },
      });
      if (!assignment) {
        return NextResponse.json({ error: "You are not assigned to this case" }, { status: 403 });
      }
    }

    const created = await prisma.timeEntry.create({
      data: {
        entryCode: `TE-${Date.now()}`,
        caseId: parsed.data.caseId,
        contractorId: parsed.data.contractorId,
        workDate: new Date(parsed.data.workDate),
        hours: parsed.data.hours,
        notes: parsed.data.notes,
        billableAmountUsd: parsed.data.billableAmountUsd,
        createdById: session.userId,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create time entry:", error);
    return NextResponse.json({ error: "Failed to create time entry" }, { status: 500 });
  }
}
