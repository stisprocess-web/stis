/**
 * @module api/time-entries
 * GET /api/time-entries — List all time entries.
 * POST /api/time-entries — Create a new time entry.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canWriteTime, getRoleFromRequest } from "@/lib/auth";
import { CreateTimeEntrySchema } from "@/lib/validation";

export async function GET() {
  try {
    const entries = await prisma.timeEntry.findMany({
      include: { contractor: true, case: true },
      orderBy: { workDate: "desc" },
    });
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Failed to fetch time entries:", error);
    return NextResponse.json({ error: "Failed to fetch time entries" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const role = await getRoleFromRequest(req);
    if (!canWriteTime(role)) {
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

    const created = await prisma.timeEntry.create({
      data: {
        entryCode: `TE-${Date.now()}`,
        caseId: parsed.data.caseId,
        contractorId: parsed.data.contractorId,
        workDate: new Date(parsed.data.workDate),
        hours: parsed.data.hours,
        notes: parsed.data.notes,
        billableAmountUsd: parsed.data.billableAmountUsd,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create time entry:", error);
    return NextResponse.json({ error: "Failed to create time entry" }, { status: 500 });
  }
}
