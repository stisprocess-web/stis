// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSpawn = vi.hoisted(() => vi.fn());
vi.mock("node:child_process", () => ({
  spawn: mockSpawn,
}));

import { POST } from "@/app/api/video/ingest/route";
import { NextRequest } from "next/server";

function makeReq(body: unknown) {
  return new NextRequest("http://localhost:3000/api/video/ingest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("video ingest API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for path traversal attempt", async () => {
    const req = makeReq({
      inputDir: "../../../etc",
      outputDir: "./video_output",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("project directory");
  });

  it("accepts valid paths and spawns python script", async () => {
    const mockProc = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn((event: string, cb: (code: number) => void) => {
        if (event === "close") cb(0);
      }),
    };
    mockSpawn.mockReturnValue(mockProc);

    // Simulate stdout data
    mockProc.stdout.on.mockImplementation((event: string, cb: (d: Buffer) => void) => {
      if (event === "data") cb(Buffer.from("Processed 10 frames"));
    });
    mockProc.stderr.on.mockImplementation(() => {});

    const req = makeReq({
      inputDir: "./video_input",
      outputDir: "./video_output",
      fpsIntervalSec: 5,
      sceneThreshold: 0.35,
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  it("returns 500 when python script fails", async () => {
    const mockProc = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn((event: string, cb: (code: number) => void) => {
        if (event === "close") cb(1);
      }),
    };
    mockSpawn.mockReturnValue(mockProc);
    mockProc.stdout.on.mockImplementation(() => {});
    mockProc.stderr.on.mockImplementation((event: string, cb: (d: Buffer) => void) => {
      if (event === "data") cb(Buffer.from("Script error"));
    });

    const req = makeReq({
      inputDir: "./video_input",
      outputDir: "./video_output",
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it("uses default values when fields omitted", async () => {
    const mockProc = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn((event: string, cb: (code: number) => void) => {
        if (event === "close") cb(0);
      }),
    };
    mockSpawn.mockReturnValue(mockProc);
    mockProc.stdout.on.mockImplementation(() => {});
    mockProc.stderr.on.mockImplementation(() => {});

    const req = makeReq({});
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockSpawn).toHaveBeenCalledWith(
      "python3",
      expect.arrayContaining(["5", "0.35"]),
      expect.anything(),
    );
  });
});
