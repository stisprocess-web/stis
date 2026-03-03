/**
 * @module api/exports/quickbooks-time.csv
 * GET /api/exports/quickbooks-time.csv — QuickBooks-compatible time activities CSV.
 */

import { prisma } from "@/lib/prisma";
import { buildCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  try {
    const rows = await prisma.timeEntry.findMany({
      include: { contractor: true, case: true },
    });

    const csv = buildCsv(
      ["Date", "Employee", "Customer", "Service", "Hours", "BillableStatus", "BillableRate", "Description"],
      rows.map((r) => [
        r.workDate.toISOString().slice(0, 10),
        r.contractor.name,
        r.case.caseCode,
        "Investigative Services",
        r.hours,
        "Billable",
        r.hours > 0 ? (r.billableAmountUsd / r.hours).toFixed(2) : "0",
        r.notes ?? "",
      ]),
    );

    return csvResponse(csv, "quickbooks-time-activities.csv");
  } catch (error) {
    console.error("Failed to export QuickBooks time:", error);
    return new Response("Export failed", { status: 500 });
  }
}
