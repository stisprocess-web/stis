import { describe, it, expect } from "vitest";
import {
  CreateTimeEntrySchema,
  CreateExpenseSchema,
  UpdateExpenseStatusSchema,
  CreateContractSchema,
  SendContractSchema,
  MarkSignedSchema,
  CaseStatusSchema,
  VideoIngestSchema,
} from "@/lib/validation";

describe("validation schemas", () => {
  describe("CreateTimeEntrySchema", () => {
    const valid = {
      caseId: "ca1",
      contractorId: "ct1",
      workDate: "2024-01-15",
      hours: 2.5,
      notes: "surveillance",
      billableAmountUsd: 312.5,
    };

    it("accepts valid input", () => {
      const result = CreateTimeEntrySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("accepts input without notes (defaults to empty)", () => {
      const { notes: _notes, ...rest } = valid;
      const result = CreateTimeEntrySchema.safeParse(rest);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.notes).toBe("");
    });

    it("rejects missing caseId", () => {
      const result = CreateTimeEntrySchema.safeParse({ ...valid, caseId: "" });
      expect(result.success).toBe(false);
    });

    it("rejects missing contractorId", () => {
      const result = CreateTimeEntrySchema.safeParse({ ...valid, contractorId: "" });
      expect(result.success).toBe(false);
    });

    it("rejects zero hours", () => {
      const result = CreateTimeEntrySchema.safeParse({ ...valid, hours: 0 });
      expect(result.success).toBe(false);
    });

    it("rejects negative hours", () => {
      const result = CreateTimeEntrySchema.safeParse({ ...valid, hours: -1 });
      expect(result.success).toBe(false);
    });

    it("rejects negative billableAmountUsd", () => {
      const result = CreateTimeEntrySchema.safeParse({ ...valid, billableAmountUsd: -10 });
      expect(result.success).toBe(false);
    });

    it("accepts zero billableAmountUsd", () => {
      const result = CreateTimeEntrySchema.safeParse({ ...valid, billableAmountUsd: 0 });
      expect(result.success).toBe(true);
    });
  });

  describe("CreateExpenseSchema", () => {
    const valid = {
      caseId: "ca1",
      contractorId: "ct1",
      category: "Mileage" as const,
      amountUsd: 45.5,
      spentDate: "2024-01-15",
      notes: "trip to courthouse",
    };

    it("accepts valid input", () => {
      const result = CreateExpenseSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("accepts all valid categories", () => {
      for (const cat of ["Mileage", "Lodging", "Meals", "Equipment", "Other"]) {
        const result = CreateExpenseSchema.safeParse({ ...valid, category: cat });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid category", () => {
      const result = CreateExpenseSchema.safeParse({ ...valid, category: "InvalidCat" });
      expect(result.success).toBe(false);
    });

    it("rejects zero amount", () => {
      const result = CreateExpenseSchema.safeParse({ ...valid, amountUsd: 0 });
      expect(result.success).toBe(false);
    });

    it("rejects negative amount", () => {
      const result = CreateExpenseSchema.safeParse({ ...valid, amountUsd: -5 });
      expect(result.success).toBe(false);
    });

    it("rejects missing spentDate", () => {
      const result = CreateExpenseSchema.safeParse({ ...valid, spentDate: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("UpdateExpenseStatusSchema", () => {
    it("accepts valid status transitions", () => {
      for (const status of ["SUBMITTED", "APPROVED", "REIMBURSED"]) {
        const result = UpdateExpenseStatusSchema.safeParse({ id: "e1", status });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid status", () => {
      const result = UpdateExpenseStatusSchema.safeParse({ id: "e1", status: "INVALID" });
      expect(result.success).toBe(false);
    });

    it("rejects empty id", () => {
      const result = UpdateExpenseStatusSchema.safeParse({ id: "", status: "APPROVED" });
      expect(result.success).toBe(false);
    });
  });

  describe("CreateContractSchema", () => {
    const valid = {
      caseCode: "PI-2024-001",
      clientName: "John Doe",
      clientEmail: "john@example.com",
      templateName: "Standard Investigation",
    };

    it("accepts valid input", () => {
      const result = CreateContractSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("accepts optional fields", () => {
      const result = CreateContractSchema.safeParse({
        ...valid,
        scopeOfWork: "Custom scope",
        retainerAmount: "10,000.00",
        hourlyRate: "150.00",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = CreateContractSchema.safeParse({ ...valid, clientEmail: "not-an-email" });
      expect(result.success).toBe(false);
    });

    it("rejects empty caseCode", () => {
      const result = CreateContractSchema.safeParse({ ...valid, caseCode: "" });
      expect(result.success).toBe(false);
    });

    it("rejects empty clientName", () => {
      const result = CreateContractSchema.safeParse({ ...valid, clientName: "" });
      expect(result.success).toBe(false);
    });

    it("rejects empty templateName", () => {
      const result = CreateContractSchema.safeParse({ ...valid, templateName: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("SendContractSchema", () => {
    it("accepts valid contractId", () => {
      const result = SendContractSchema.safeParse({ contractId: "c1" });
      expect(result.success).toBe(true);
    });

    it("rejects empty contractId", () => {
      const result = SendContractSchema.safeParse({ contractId: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("MarkSignedSchema", () => {
    it("accepts valid input", () => {
      const result = MarkSignedSchema.safeParse({
        contractId: "c1",
        officeEmail: "office@company.com",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = MarkSignedSchema.safeParse({
        contractId: "c1",
        officeEmail: "not-email",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty contractId", () => {
      const result = MarkSignedSchema.safeParse({
        contractId: "",
        officeEmail: "office@company.com",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("CaseStatusSchema", () => {
    it("accepts all valid statuses", () => {
      for (const status of ["INTAKE", "ACTIVE", "PENDING", "CLOSED"]) {
        const result = CaseStatusSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid status", () => {
      const result = CaseStatusSchema.safeParse({ status: "DELETED" });
      expect(result.success).toBe(false);
    });
  });

  describe("VideoIngestSchema", () => {
    it("accepts valid input with all fields", () => {
      const result = VideoIngestSchema.safeParse({
        inputDir: "/videos/input",
        outputDir: "/videos/output",
        fpsIntervalSec: 10,
        sceneThreshold: 0.5,
      });
      expect(result.success).toBe(true);
    });

    it("uses defaults for missing optional fields", () => {
      const result = VideoIngestSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.inputDir).toBe("./video_input");
        expect(result.data.outputDir).toBe("./video_output");
        expect(result.data.fpsIntervalSec).toBe(5);
        expect(result.data.sceneThreshold).toBe(0.35);
      }
    });

    it("rejects sceneThreshold > 1", () => {
      const result = VideoIngestSchema.safeParse({
        sceneThreshold: 1.5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects sceneThreshold < 0", () => {
      const result = VideoIngestSchema.safeParse({
        sceneThreshold: -0.1,
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer fpsIntervalSec", () => {
      const result = VideoIngestSchema.safeParse({
        fpsIntervalSec: 2.5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative fpsIntervalSec", () => {
      const result = VideoIngestSchema.safeParse({
        fpsIntervalSec: -1,
      });
      expect(result.success).toBe(false);
    });
  });
});
