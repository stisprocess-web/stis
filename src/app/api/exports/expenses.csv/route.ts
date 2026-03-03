/**
 * @module api/exports/expenses.csv
 * GET /api/exports/expenses.csv — Download expenses as CSV.
 */

import { prisma } from "@/lib/prisma";
import { buildCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      include: { contractor: true, case: true },
      orderBy: { spentDate: "desc" },
    });

    const csv = buildCsv(
      ["expenseCode", "spentDate", "contractor", "caseCode", "category", "amountUsd", "status", "notes"],
      expenses.map((e) => [
        e.expenseCode,
        e.spentDate.toISOString().slice(0, 10),
        e.contractor.name,
        e.case.caseCode,
        e.category,
        e.amountUsd,
        e.status,
        e.notes ?? "",
      ]),
    );

    return csvResponse(csv, "expenses.csv");
  } catch (error) {
    console.error("Failed to export expenses:", error);
    return new Response("Export failed", { status: 500 });
  }
}
