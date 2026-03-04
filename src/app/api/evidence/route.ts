/**
 * @module api/evidence
 * POST /api/evidence — Create a new evidence record with auto-generated evidence code.
 *
 * Investigators can only create evidence on their assigned cases.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest, isAdmin } from "@/lib/auth";
import { roleAllowed, accessPolicy } from "@/lib/roles";
import { z } from "zod";

const CreateEvidenceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string().min(1, "Type is required"),
  caseId: z.string().min(1, "Case ID is required"),
  filePath: z.string().optional(),
  chainOfCustody: z.string().optional().default(""),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || !roleAllowed(session.role, [...accessPolicy.evidenceView])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Clients cannot create evidence
    if (session.role === "client") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = CreateEvidenceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Investigators can only add evidence to their assigned cases
    if (session.role === "investigator") {
      const assignment = await prisma.caseAssignment.findUnique({
        where: { caseId_userId: { caseId: parsed.data.caseId, userId: session.userId } },
      });
      if (!assignment) {
        return NextResponse.json({ error: "You are not assigned to this case" }, { status: 403 });
      }
    }

    // Auto-generate evidence code
    const count = await prisma.evidence.count();
    const evidenceCode = `EV-${String(count + 1).padStart(4, "0")}`;

    const evidence = await prisma.evidence.create({
      data: {
        evidenceCode,
        title: parsed.data.title,
        type: parsed.data.type,
        caseId: parsed.data.caseId,
        filePath: parsed.data.filePath ?? null,
        chainOfCustody: parsed.data.chainOfCustody,
        uploadedById: session.userId,
      },
    });

    return NextResponse.json(evidence, { status: 201 });
  } catch (error) {
    console.error("Failed to create evidence:", error);
    return NextResponse.json({ error: "Failed to create evidence" }, { status: 500 });
  }
}
