import { describe, it, expect } from "vitest";
import { buildCsv, csvResponse } from "@/lib/csv";

describe("csv", () => {
  describe("buildCsv", () => {
    it("creates CSV with headers and rows", () => {
      const csv = buildCsv(["Name", "Age"], [["Alice", 30], ["Bob", 25]]);
      expect(csv).toBe("Name,Age\nAlice,30\nBob,25");
    });

    it("handles empty rows", () => {
      const csv = buildCsv(["A", "B"], []);
      expect(csv).toBe("A,B");
    });

    it("escapes commas in field values", () => {
      const csv = buildCsv(["Name"], [["Doe, John"]]);
      expect(csv).toBe('Name\n"Doe, John"');
    });

    it("escapes double quotes", () => {
      const csv = buildCsv(["Note"], [['He said "hello"']]);
      expect(csv).toBe('Note\n"He said ""hello"""');
    });

    it("escapes newlines in field values", () => {
      const csv = buildCsv(["Note"], [["line1\nline2"]]);
      expect(csv).toBe('Note\n"line1\nline2"');
    });

    it("handles null and undefined values", () => {
      const csv = buildCsv(["A", "B"], [[null, undefined]]);
      expect(csv).toBe("A,B\n,");
    });

    it("handles numeric values", () => {
      const csv = buildCsv(["Amount"], [[125.50]]);
      expect(csv).toBe("Amount\n125.5");
    });

    it("handles multiple rows", () => {
      const csv = buildCsv(["X"], [["a"], ["b"], ["c"]]);
      const lines = csv.split("\n");
      expect(lines).toHaveLength(4);
    });
  });

  describe("csvResponse", () => {
    it("creates a NextResponse with CSV content type", () => {
      const res = csvResponse("A,B\n1,2", "test.csv");
      expect(res.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    });

    it("sets Content-Disposition header", () => {
      const res = csvResponse("data", "export.csv");
      expect(res.headers.get("Content-Disposition")).toBe("attachment; filename=export.csv");
    });

    it("includes the CSV body", async () => {
      const csv = "Name,Age\nAlice,30";
      const res = csvResponse(csv, "test.csv");
      const body = await res.text();
      expect(body).toBe(csv);
    });
  });
});
