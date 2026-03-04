/**
 * @module api/cases/[id]/assignments
 * GET /api/cases/[id]/assignments — List investigators assigned to a case.
 * POST /api/cases/[id]/assignments — Assign an investigator to a case.
 * DELETE /api/cases/[id]/assignments — Remove an investigator from a case.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest, isAdmin } from "@/lib/auth";
import { roleAllowed, accessPolicy } from "@/lib/roles";
import { z } from "zod";

const AssignSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || !roleAllowed(session.role, [...accessPolicy.caseManagement])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: caseId } = await context.params;
    const assignments = await prisma.caseAssignment.findMany({
      where: { caseId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { assignedAt: "desc" },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Failed to fetch assignments:", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || !roleAllowed(session.role, [...accessPolicy.caseManagement])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: caseId } = await context.params;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = AssignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Verify the case exists
    const caseExists = await prisma.case.findUnique({ where: { id: caseId } });
    if (!caseExists) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for existing assignment
    const existing = await prisma.caseAssignment.findUnique({
      where: { caseId_userId: { caseId, userId: parsed.data.userId } },
    });
    if (existing) {
      return NextResponse.json({ error: "User is already assigned to this case" }, { status: 409 });
    }

    const assignment = await prisma.caseAssignment.create({
      data: { caseId, userId: parsed.data.userId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Failed to create assignment:", error);
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || !roleAllowed(session.role, [...accessPolicy.caseManagement])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: caseId } = await context.params;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = AssignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await prisma.caseAssignment.delete({
      where: { caseId_userId: { caseId, userId: parsed.data.userId } },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to remove assignment:", error);
    return NextResponse.json({ error: "Failed to remove assignment" }, { status: 500 });
  }
}
