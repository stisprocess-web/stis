/**
 * @module api/contracts/mark-signed
 * POST /api/contracts/mark-signed — Mark a contract as signed and queue email notifications.
 *
 * Updates the contract status, records the signed copy path (the original PDF),
 * and queues email notifications to the client and office via the local email queue.
 */

import { NextRequest, NextResponse } from "next/server";
import { listContracts, saveContracts, queueContractEmails } from "@/lib/contracts";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const contractId = String(form.get("contractId") ?? "").trim();
    const officeEmail = String(form.get("officeEmail") ?? "").trim();

    if (!contractId || !officeEmail) {
      return NextResponse.json({ error: "Contract ID and office email are required" }, { status: 400 });
    }

    if (!officeEmail.includes("@") || !officeEmail.includes(".")) {
      return NextResponse.json({ error: "Invalid office email address" }, { status: 400 });
    }

    const rows = await listContracts();
    const idx = rows.findIndex((r) => r.id === contractId);
    if (idx < 0) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const contract = rows[idx];

    if (contract.status === "signed") {
      return NextResponse.json({ error: "Contract is already signed" }, { status: 400 });
    }

    // Use the generated PDF as the signed copy
    const signedCopyPath = contract.pdfPath || `data/contracts/${contractId}.pdf`;

    rows[idx].status = "signed";
    rows[idx].signedAt = new Date().toISOString();
    rows[idx].signedCopyPath = signedCopyPath;
    await saveContracts(rows);

    // Queue email notifications
    await queueContractEmails(contractId, contract.clientEmail, officeEmail, signedCopyPath);

    return NextResponse.redirect(new URL("/contracts?signed=1", req.url));
  } catch (error) {
    console.error("Failed to mark contract as signed:", error);
    return NextResponse.json({ error: "Failed to mark contract as signed" }, { status: 500 });
  }
}
