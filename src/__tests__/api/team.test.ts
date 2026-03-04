// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  contractor: { count: vi.fn() },
  expense: { aggregate: vi.fn() },
  timeEntry: { aggregate: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { GET } from "@/app/api/team/summary/route";

describe("team API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/team/summary", () => {
    it("returns team summary metrics", async () => {
      mockPrisma.contractor.count.mockResolvedValue(5);
      mockPrisma.expense.aggregate.mockResolvedValue({ _sum: { amountUsd: 2500 } });
      mockPrisma.timeEntry.aggregate
        .mockResolvedValueOnce({ _sum: { hours: 320 } })
        .mockResolvedValueOnce({ _sum: { billableAmountUsd: 40000 } });

      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.contractors1099).toBe(5);
      expect(data.openExpenseUsd).toBe(2500);
      expect(data.billableHours).toBe(320);
      expect(data.billableAmountUsd).toBe(40000);
    });

    it("handles null aggregation sums", async () => {
      mockPrisma.contractor.count.mockResolvedValue(0);
      mockPrisma.expense.aggregate.mockResolvedValue({ _sum: { amountUsd: null } });
      mockPrisma.timeEntry.aggregate
        .mockResolvedValueOnce({ _sum: { hours: null } })
        .mockResolvedValueOnce({ _sum: { billableAmountUsd: null } });

      const res = await GET();
      const data = await res.json();
      expect(data.openExpenseUsd).toBe(0);
      expect(data.billableHours).toBe(0);
      expect(data.billableAmountUsd).toBe(0);
    });
  });
});
