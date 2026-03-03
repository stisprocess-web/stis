/**
 * @module api/contracts/send
 * POST /api/contracts/send — Mark a contract as sent for signature.
 *
 * No third-party services — this tracks the send status locally.
 * The generated PDF can be printed, emailed manually, or delivered for wet signature.
 */

import { NextRequest, NextResponse } from "next/server";
import { listContracts, saveContracts } from "@/lib/contracts";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const contractId = String(form.get("contractId") ?? "").trim();

    if (!contractId) {
      return NextResponse.json({ error: "Contract ID is required" }, { status: 400 });
    }

    const rows = await listContracts();
    const idx = rows.findIndex((r) => r.id === contractId);
    if (idx < 0) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    if (rows[idx].status === "signed") {
      return NextResponse.json({ error: "Contract is already signed" }, { status: 400 });
    }

    rows[idx].status = "sent";
    rows[idx].sentAt = new Date().toISOString();
    await saveContracts(rows);

    return NextResponse.redirect(new URL("/contracts?sent=1", req.url));
  } catch (error) {
    console.error("Failed to send contract:", error);
    return NextResponse.json({ error: "Failed to send contract" }, { status: 500 });
  }
}
