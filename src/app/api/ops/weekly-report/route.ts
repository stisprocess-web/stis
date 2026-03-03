/**
 * @module api/ops/weekly-report
 * GET /api/ops/weekly-report — Weekly owner report with JSON data and Markdown summary.
 */

import { NextResponse } from "next/server";
import { getWeeklyOwnerReport } from "@/lib/ops";

export async function GET() {
  try {
    const data = await getWeeklyOwnerReport();

    const markdown = [
      "# Weekly Owner Report",
      `Generated: ${new Date(data.generatedAt).toISOString()}`,
      "",
      "## 7-Day Financial Snapshot",
      `- Revenue: $${data.sevenDay.revenue7.toLocaleString()}`,
      `- Labor: $${data.sevenDay.labor7.toLocaleString()}`,
      `- Expenses: $${data.sevenDay.expenses7.toLocaleString()}`,
      `- Margin: $${data.sevenDay.margin7.toLocaleString()}`,
      "",
      "## Case Pipeline",
      ...data.casePipeline.map((c) => `- ${c.status}: ${c._count._all}`),
      "",
      "## Investigator Performance",
      ...data.investigatorPerformance.map(
        (i) =>
          `- ${i.name}: ${i.hours}h, $${i.billable.toLocaleString()} billable, ` +
          `productivity ${i.productivity.toFixed(2)}`,
      ),
    ].join("\n");

    return NextResponse.json({ ...data, markdown });
  } catch (error) {
    console.error("Failed to generate weekly report:", error);
    return NextResponse.json({ error: "Failed to generate weekly report" }, { status: 500 });
  }
}
