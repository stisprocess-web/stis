/**
 * @module api/cases
 * POST /api/cases — Create a new case with auto-generated case code.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest, isAdmin } from "@/lib/auth";
import { roleAllowed, accessPolicy } from "@/lib/roles";
import { z } from "zod";

const CreateCaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  clientId: z.string().min(1, "Client ID is required"),
  investigator: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().default("MEDIUM"),
  dueDate: z.string().optional(),
  visibility: z.enum(["normal", "confidential"]).optional().default("normal"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || !roleAllowed(session.role, [...accessPolicy.caseManagement])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = CreateCaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Only admin can create confidential cases
    if (parsed.data.visibility === "confidential" && !isAdmin(session.role)) {
      return NextResponse.json({ error: "Only admin can create confidential cases" }, { status: 403 });
    }

    // Auto-generate case code
    const count = await prisma.case.count();
    const caseCode = `CASE-${String(count + 1).padStart(4, "0")}`;

    const newCase = await prisma.case.create({
      data: {
        caseCode,
        title: parsed.data.title,
        clientId: parsed.data.clientId,
        investigator: parsed.data.investigator ?? null,
        priority: parsed.data.priority,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        visibility: parsed.data.visibility,
      },
    });

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    console.error("Failed to create case:", error);
    return NextResponse.json({ error: "Failed to create case" }, { status: 500 });
  }
}
