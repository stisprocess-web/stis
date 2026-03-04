/**
 * @module api/evidence
 * POST /api/evidence — Create a new evidence record with auto-generated evidence code.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRoleFromRequest } from "@/lib/auth";
import { roleAllowed } from "@/lib/roles";
import type { AppRole } from "@/lib/auth";
import { z } from "zod";

const ALLOWED_ROLES: readonly AppRole[] = ["owner", "admin", "investigator"];

const CreateEvidenceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string().min(1, "Type is required"),
  caseId: z.string().min(1, "Case ID is required"),
  filePath: z.string().optional(),
  chainOfCustody: z.string().optional().default(""),
});

export async function POST(req: NextRequest) {
  try {
    const role = await getRoleFromRequest(req);
    if (!roleAllowed(role, [...ALLOWED_ROLES])) {
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
      },
    });

    return NextResponse.json(evidence, { status: 201 });
  } catch (error) {
    console.error("Failed to create evidence:", error);
    return NextResponse.json({ error: "Failed to create evidence" }, { status: 500 });
  }
}
