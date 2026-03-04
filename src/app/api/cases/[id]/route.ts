/**
 * @module api/cases/[id]
 * DELETE /api/cases/:id — Archive a case by setting status to CLOSED.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRoleFromRequest } from "@/lib/auth";
import { roleAllowed, accessPolicy } from "@/lib/roles";

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const role = await getRoleFromRequest(req);
    if (!roleAllowed(role, [...accessPolicy.caseManagement])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await ctx.params;

    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Soft-delete: set status to CLOSED rather than hard delete
    const updated = await prisma.case.update({
      where: { id },
      data: { status: "CLOSED" },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to delete case:", error);
    return NextResponse.json({ error: "Failed to delete case" }, { status: 500 });
  }
}
