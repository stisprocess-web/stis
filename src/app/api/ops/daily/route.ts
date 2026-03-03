/**
 * @module api/ops/daily
 * GET /api/ops/daily — Daily operations snapshot (JSON).
 */

import { NextResponse } from "next/server";
import { getDailyOpsSnapshot } from "@/lib/ops";

export async function GET() {
  try {
    const data = await getDailyOpsSnapshot();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to generate daily ops snapshot:", error);
    return NextResponse.json({ error: "Failed to generate daily ops snapshot" }, { status: 500 });
  }
}
