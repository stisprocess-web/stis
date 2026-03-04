// @vitest-environment node
/**
 * Workflow test: Create time entry → verify in exports
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  timeEntry: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { POST } from "@/app/api/time-entries/route";
import { GET as exportGET } from "@/app/api/exports/time-entries.csv/route";
import { NextRequest } from "next/server";
import { createSessionToken } from "@/lib/session";

describe("workflow: create time entry → verify in exports", () => {
  let ownerToken: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    ownerToken = await createSessionToken({ userId: "u1", email: "o@t.com", role: "owner" });
  });

  it("creates a time entry then finds it in CSV export", async () => {
    // Step 1: Create time entry
    const entryData = {
      caseId: "ca1",
      contractorId: "ct1",
      workDate: "2024-01-15",
      hours: 3,
      billableAmountUsd: 375,
      notes: "surveillance at target location",
    };

    mockPrisma.timeEntry.create.mockResolvedValue({
      id: "te-new",
      entryCode: "TE-123",
      ...entryData,
      workDate: new Date("2024-01-15"),
    });

    const createReq = new NextRequest("http://localhost:3000/api/time-entries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(entryData),
    });
    createReq.cookies.set("session", ownerToken);
    const createRes = await POST(createReq);
    expect(createRes.status).toBe(201);

    // Step 2: Verify the entry appears in CSV export
    mockPrisma.timeEntry.findMany.mockResolvedValue([
      {
        entryCode: "TE-123",
        workDate: new Date("2024-01-15"),
        hours: 3,
        billableAmountUsd: 375,
        notes: "surveillance at target location",
        contractor: { name: "Alice Investigator" },
        case: { caseCode: "PI-001" },
      },
    ]);

    const exportRes = await exportGET();
    const csv = await exportRes.text();

    // Verify the CSV contains our entry
    expect(csv).toContain("TE-123");
    expect(csv).toContain("Alice Investigator");
    expect(csv).toContain("PI-001");
    expect(csv).toContain("375");
    expect(csv).toContain("surveillance at target location");

    // Verify CSV structure
    const lines = csv.split("\n");
    expect(lines[0]).toBe("entryCode,workDate,contractor,caseCode,hours,billableAmountUsd,notes");
    expect(lines).toHaveLength(2); // header + 1 row
  });

  it("multiple time entries appear in export", async () => {
    mockPrisma.timeEntry.findMany.mockResolvedValue([
      {
        entryCode: "TE-1",
        workDate: new Date("2024-01-15"),
        hours: 2,
        billableAmountUsd: 250,
        notes: "interview",
        contractor: { name: "Alice" },
        case: { caseCode: "PI-001" },
      },
      {
        entryCode: "TE-2",
        workDate: new Date("2024-01-16"),
        hours: 4,
        billableAmountUsd: 500,
        notes: "stakeout",
        contractor: { name: "Bob" },
        case: { caseCode: "PI-002" },
      },
    ]);

    const exportRes = await exportGET();
    const csv = await exportRes.text();
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3); // header + 2 rows
    expect(csv).toContain("TE-1");
    expect(csv).toContain("TE-2");
  });
});
