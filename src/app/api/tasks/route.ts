/**
 * @module api/tasks
 * POST /api/tasks — Create a new task linked to a case.
 *
 * Investigators can only create tasks on their assigned cases.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { roleAllowed, accessPolicy } from "@/lib/roles";
import { z } from "zod";

const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  caseId: z.string().min(1, "Case ID is required"),
  owner: z.string().min(1, "Owner is required"),
  dueDate: z.string().optional(),
  done: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || !roleAllowed(session.role, [...accessPolicy.taskView])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = CreateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Investigators can only create tasks on their assigned cases
    if (session.role === "investigator") {
      const assignment = await prisma.caseAssignment.findUnique({
        where: { caseId_userId: { caseId: parsed.data.caseId, userId: session.userId } },
      });
      if (!assignment) {
        return NextResponse.json({ error: "You are not assigned to this case" }, { status: 403 });
      }
    }

    const task = await prisma.task.create({
      data: {
        title: parsed.data.title,
        caseId: parsed.data.caseId,
        owner: parsed.data.owner,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        done: parsed.data.done,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
