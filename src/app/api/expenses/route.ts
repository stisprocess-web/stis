/**
 * @module api/expenses
 * GET /api/expenses — List all expenses.
 * POST /api/expenses — Submit a new expense.
 * PATCH /api/expenses — Update expense status (approve/reimburse).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canApproveExpenses, canSubmitExpenses, getRoleFromRequest } from "@/lib/auth";
import { CreateExpenseSchema, UpdateExpenseStatusSchema } from "@/lib/validation";

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      include: { contractor: true, case: true },
      orderBy: { spentDate: "desc" },
    });
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const role = await getRoleFromRequest(req);
    if (!canSubmitExpenses(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = CreateExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const created = await prisma.expense.create({
      data: {
        expenseCode: `EX-${Date.now()}`,
        caseId: parsed.data.caseId,
        contractorId: parsed.data.contractorId,
        category: parsed.data.category,
        amountUsd: parsed.data.amountUsd,
        spentDate: new Date(parsed.data.spentDate),
        notes: parsed.data.notes,
        status: "SUBMITTED",
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create expense:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const role = await getRoleFromRequest(req);
    if (!canApproveExpenses(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = UpdateExpenseStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.expense.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update expense:", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}
