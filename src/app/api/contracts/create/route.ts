/**
 * @module api/contracts/create
 * POST /api/contracts/create — Create a contract record and generate a PDF.
 *
 * Accepts form data from the contracts page. Generates a professional PDF
 * with signature blocks using pdf-lib. Stores the record and redirects.
 */

import { NextRequest, NextResponse } from "next/server";
import { listContracts, saveContracts, generateContractPdf } from "@/lib/contracts";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const caseCode = String(form.get("caseCode") ?? "").trim();
    const clientName = String(form.get("clientName") ?? "").trim();
    const clientEmail = String(form.get("clientEmail") ?? "").trim();
    const templateName = String(form.get("templateName") ?? "").trim();
    const scopeOfWork = String(form.get("scopeOfWork") ?? "").trim() || undefined;
    const retainerAmount = String(form.get("retainerAmount") ?? "").trim() || undefined;
    const hourlyRate = String(form.get("hourlyRate") ?? "").trim() || undefined;

    if (!caseCode || !clientName || !clientEmail || !templateName) {
      return NextResponse.json({ error: "All required fields must be provided" }, { status: 400 });
    }

    // Basic email validation
    if (!clientEmail.includes("@") || !clientEmail.includes(".")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const contractId = `CTR-${Date.now()}`;

    // Generate PDF with signature blocks
    const pdfPath = await generateContractPdf(contractId, {
      caseCode,
      clientName,
      clientEmail,
      templateName,
      scopeOfWork,
      retainerAmount,
      hourlyRate,
    });

    // Save contract record
    const rows = await listContracts();
    rows.unshift({
      id: contractId,
      caseCode,
      clientName,
      clientEmail,
      templateName,
      status: "draft",
      pdfPath,
    });
    await saveContracts(rows);

    return NextResponse.redirect(new URL("/contracts", req.url));
  } catch (error) {
    console.error("Failed to create contract:", error);
    return NextResponse.json({ error: "Failed to create contract" }, { status: 500 });
  }
}
