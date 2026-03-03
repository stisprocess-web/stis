/**
 * @module api/exports/quickbooks-expenses.csv
 * GET /api/exports/quickbooks-expenses.csv — QuickBooks-compatible expenses CSV.
 */

import { prisma } from "@/lib/prisma";
import { buildCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  try {
    const rows = await prisma.expense.findMany({
      include: { contractor: true, case: true },
    });

    const csv = buildCsv(
      ["Date", "Payee", "Category", "Customer", "Amount", "Billable", "Memo"],
      rows.map((r) => [
        r.spentDate.toISOString().slice(0, 10),
        r.contractor.name,
        r.category,
        r.case.caseCode,
        r.amountUsd.toFixed(2),
        "Yes",
        r.notes ?? "",
      ]),
    );

    return csvResponse(csv, "quickbooks-expenses.csv");
  } catch (error) {
    console.error("Failed to export QuickBooks expenses:", error);
    return new Response("Export failed", { status: 500 });
  }
}
