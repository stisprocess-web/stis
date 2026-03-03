/**
 * @module lib/validation
 * Shared Zod schemas for API request validation.
 *
 * Centralizes input validation to avoid duplicating schema definitions
 * across route handlers. All API routes should import from here.
 */

import { z } from "zod";

/** Schema for creating a new time entry. */
export const CreateTimeEntrySchema = z.object({
  caseId: z.string().min(1, "Case ID is required"),
  contractorId: z.string().min(1, "Contractor ID is required"),
  workDate: z.string().min(1, "Work date is required"),
  hours: z.number().positive("Hours must be positive"),
  notes: z.string().optional().default(""),
  billableAmountUsd: z.number().nonnegative("Billable amount cannot be negative"),
});

/** Schema for creating a new expense. */
export const CreateExpenseSchema = z.object({
  caseId: z.string().min(1, "Case ID is required"),
  contractorId: z.string().min(1, "Contractor ID is required"),
  category: z.enum(["Mileage", "Lodging", "Meals", "Equipment", "Other"], {
    message: "Invalid expense category",
  }),
  amountUsd: z.number().positive("Amount must be positive"),
  spentDate: z.string().min(1, "Spent date is required"),
  notes: z.string().optional().default(""),
});

/** Schema for updating expense status. */
export const UpdateExpenseStatusSchema = z.object({
  id: z.string().min(1, "Expense ID is required"),
  status: z.enum(["SUBMITTED", "APPROVED", "REIMBURSED"], {
    message: "Invalid expense status",
  }),
});

/** Schema for creating a contract record. */
export const CreateContractSchema = z.object({
  caseCode: z.string().min(1, "Case code is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Valid email is required"),
  templateName: z.string().min(1, "Template name is required"),
  scopeOfWork: z.string().optional(),
  retainerAmount: z.string().optional(),
  hourlyRate: z.string().optional(),
});

/** Schema for sending a contract for signature. */
export const SendContractSchema = z.object({
  contractId: z.string().min(1, "Contract ID is required"),
});

/** Schema for marking a contract as signed. */
export const MarkSignedSchema = z.object({
  contractId: z.string().min(1, "Contract ID is required"),
  officeEmail: z.string().email("Valid office email is required"),
});

/** Schema for case status transitions. */
export const CaseStatusSchema = z.object({
  status: z.enum(["INTAKE", "ACTIVE", "PENDING", "CLOSED"], {
    message: "Invalid case status",
  }),
});

/** Schema for video ingest requests. */
export const VideoIngestSchema = z.object({
  inputDir: z.string().min(1).default("./video_input"),
  outputDir: z.string().min(1).default("./video_output"),
  fpsIntervalSec: z.number().int().positive().default(5),
  sceneThreshold: z.number().min(0).max(1).default(0.35),
});
