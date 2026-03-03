/**
 * @module api/video/ingest
 * POST /api/video/ingest — Trigger video frame extraction via Python script.
 *
 * Input/output directories are validated to prevent path traversal attacks.
 */

import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";
import { VideoIngestSchema } from "@/lib/validation";

/** Validate that a path doesn't escape the project directory. */
function isSafePath(dir: string): boolean {
  const resolved = path.resolve(process.cwd(), dir);
  return resolved.startsWith(process.cwd());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = VideoIngestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { inputDir, outputDir, fpsIntervalSec, sceneThreshold } = parsed.data;

    // Prevent path traversal
    if (!isSafePath(inputDir) || !isSafePath(outputDir)) {
      return NextResponse.json(
        { error: "Directory paths must be within the project directory" },
        { status: 400 },
      );
    }

    const scriptPath = path.join(process.cwd(), "scripts", "video_ingest_mvp.py");
    const proc = spawn(
      "python3",
      [scriptPath, inputDir, outputDir, String(fpsIntervalSec), String(sceneThreshold)],
      { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] },
    );

    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += String(d)));
    proc.stderr.on("data", (d) => (stderr += String(d)));

    const code: number = await new Promise((resolve) => proc.on("close", resolve));

    if (code !== 0) {
      return NextResponse.json(
        { error: "Video ingest failed", details: stderr || stdout },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, output: stdout.trim() });
  } catch (error) {
    console.error("Video ingest error:", error);
    return NextResponse.json({ error: "Video ingest failed" }, { status: 500 });
  }
}
