/**
 * @module api/invoices
 * POST /api/invoices — Create a new invoice with auto-generated invoice code.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRoleFromRequest } from "@/lib/auth";
import { roleAllowed } from "@/lib/roles";
import type { AppRole } from "@/lib/auth";
import { z } from "zod";

const ALLOWED_ROLES: readonly AppRole[] = ["owner", "admin", "billing"];

const CreateInvoiceSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  caseId: z.string().min(1, "Case ID is required"),
  amountUsd: z.number().positive("Amount must be positive"),
  dueDate: z.string().optional(),
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

    const parsed = CreateInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Auto-generate invoice code
    const count = await prisma.invoice.count();
    const invoiceCode = `INV-${String(count + 1).padStart(4, "0")}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceCode,
        clientId: parsed.data.clientId,
        caseId: parsed.data.caseId,
        amountUsd: parsed.data.amountUsd,
        issuedDate: new Date(),
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Failed to create invoice:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
