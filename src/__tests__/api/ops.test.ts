// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetDailyOps = vi.hoisted(() => vi.fn());
const mockGetWeeklyReport = vi.hoisted(() => vi.fn());

vi.mock("@/lib/ops", () => ({
  getDailyOpsSnapshot: mockGetDailyOps,
  getWeeklyOwnerReport: mockGetWeeklyReport,
}));

import { GET as dailyGET } from "@/app/api/ops/daily/route";
import { GET as weeklyGET } from "@/app/api/ops/weekly-report/route";

describe("ops API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/ops/daily", () => {
    it("returns daily snapshot", async () => {
      mockGetDailyOps.mockResolvedValue({
        generatedAt: new Date(),
        overdueTasks: [],
        atRiskCases: [],
        unbilled: { hours: 0, amountUsd: 0 },
      });
      const res = await dailyGET();
      expect(res.status).toBe(200);
    });

    it("returns 500 on error", async () => {
      mockGetDailyOps.mockRejectedValue(new Error("fail"));
      const res = await dailyGET();
      expect(res.status).toBe(500);
    });
  });

  describe("GET /api/ops/weekly-report", () => {
    it("returns weekly report with markdown", async () => {
      mockGetWeeklyReport.mockResolvedValue({
        generatedAt: new Date(),
        sevenDay: { revenue7: 10000, labor7: 5000, expenses7: 1000, margin7: 4000 },
        casePipeline: [{ status: "ACTIVE", _count: { _all: 5 } }],
        investigatorPerformance: [
          { name: "Alice", hours: 40, billable: 5000, reimb: 200, productivity: 125 },
        ],
      });
      const res = await weeklyGET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.markdown).toContain("Weekly Owner Report");
      expect(data.markdown).toContain("Revenue");
      expect(data.sevenDay.revenue7).toBe(10000);
    });

    it("returns 500 on error", async () => {
      mockGetWeeklyReport.mockRejectedValue(new Error("fail"));
      const res = await weeklyGET();
      expect(res.status).toBe(500);
    });
  });
});
