/**
 * @module api/analytics/overview
 * GET /api/analytics/overview — Aggregated analytics overview.
 */

import { NextResponse } from "next/server";
import { getAnalyticsOverview } from "@/lib/analytics";

export async function GET() {
  try {
    const data = await getAnalyticsOverview();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to compute analytics overview:", error);
    return NextResponse.json(
      { error: "Failed to compute analytics overview" },
      { status: 500 },
    );
  }
}
