/**
 * @module api/exports/time-entries.csv
 * GET /api/exports/time-entries.csv — Download time entries as CSV.
 */

import { prisma } from "@/lib/prisma";
import { buildCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  try {
    const entries = await prisma.timeEntry.findMany({
      include: { contractor: true, case: true },
      orderBy: { workDate: "desc" },
    });

    const csv = buildCsv(
      ["entryCode", "workDate", "contractor", "caseCode", "hours", "billableAmountUsd", "notes"],
      entries.map((e) => [
        e.entryCode,
        e.workDate.toISOString().slice(0, 10),
        e.contractor.name,
        e.case.caseCode,
        e.hours,
        e.billableAmountUsd,
        e.notes ?? "",
      ]),
    );

    return csvResponse(csv, "time-entries.csv");
  } catch (error) {
    console.error("Failed to export time entries:", error);
    return new Response("Export failed", { status: 500 });
  }
}
