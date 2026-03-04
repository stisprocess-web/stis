import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import path from "node:path";
import { promises as fs } from "node:fs";
import {
  generateContractPdf,
  listContracts,
  saveContracts,
  findContract,
  updateContract,
  queueContractEmails,
  type ContractRecord,
} from "@/lib/contracts";

const TEST_DATA_DIR = path.join(process.cwd(), "data");
const TEST_CONTRACTS_FILE = path.join(TEST_DATA_DIR, "contracts.json");
const TEST_CONTRACTS_DIR = path.join(TEST_DATA_DIR, "contracts");
const TEST_EMAIL_QUEUE = path.join(TEST_DATA_DIR, "email_queue.jsonl");

describe("contracts", () => {
  let originalContracts: string | null = null;
  let originalEmailQueue: string | null = null;

  beforeEach(async () => {
    // Backup existing files
    try {
      originalContracts = await fs.readFile(TEST_CONTRACTS_FILE, "utf8");
    } catch {
      originalContracts = null;
    }
    try {
      originalEmailQueue = await fs.readFile(TEST_EMAIL_QUEUE, "utf8");
    } catch {
      originalEmailQueue = null;
    }
    // Start with empty contracts
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
    await fs.mkdir(TEST_CONTRACTS_DIR, { recursive: true });
    await fs.writeFile(TEST_CONTRACTS_FILE, "[]", "utf8");
  });

  afterEach(async () => {
    // Restore original files
    if (originalContracts !== null) {
      await fs.writeFile(TEST_CONTRACTS_FILE, originalContracts, "utf8");
    } else {
      try { await fs.unlink(TEST_CONTRACTS_FILE); } catch {}
    }
    if (originalEmailQueue !== null) {
      await fs.writeFile(TEST_EMAIL_QUEUE, originalEmailQueue, "utf8");
    } else {
      try { await fs.unlink(TEST_EMAIL_QUEUE); } catch {}
    }
    // Clean test PDFs
    try {
      const files = await fs.readdir(TEST_CONTRACTS_DIR);
      for (const f of files) {
        if (f.startsWith("test-contract-")) {
          await fs.unlink(path.join(TEST_CONTRACTS_DIR, f));
        }
      }
    } catch {}
  });

  describe("listContracts", () => {
    it("returns empty array when no contracts exist", async () => {
      const result = await listContracts();
      expect(result).toEqual([]);
    });

    it("returns saved contracts", async () => {
      const contracts: ContractRecord[] = [
        { id: "c1", caseCode: "PI-001", clientName: "John", clientEmail: "j@t.com", templateName: "Standard", status: "draft" },
      ];
      await fs.writeFile(TEST_CONTRACTS_FILE, JSON.stringify(contracts), "utf8");
      const result = await listContracts();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("c1");
    });
  });

  describe("saveContracts", () => {
    it("persists contracts to JSON file", async () => {
      const contracts: ContractRecord[] = [
        { id: "c1", caseCode: "PI-001", clientName: "John", clientEmail: "j@t.com", templateName: "Standard", status: "draft" },
      ];
      await saveContracts(contracts);
      const raw = await fs.readFile(TEST_CONTRACTS_FILE, "utf8");
      const saved = JSON.parse(raw);
      expect(saved).toHaveLength(1);
      expect(saved[0].id).toBe("c1");
    });
  });

  describe("findContract", () => {
    it("finds contract by id", async () => {
      const contracts: ContractRecord[] = [
        { id: "c1", caseCode: "PI-001", clientName: "John", clientEmail: "j@t.com", templateName: "Standard", status: "draft" },
        { id: "c2", caseCode: "PI-002", clientName: "Jane", clientEmail: "jane@t.com", templateName: "Standard", status: "sent" },
      ];
      await saveContracts(contracts);
      const result = await findContract("c2");
      expect(result).not.toBeNull();
      expect(result!.clientName).toBe("Jane");
    });

    it("returns null for non-existent id", async () => {
      const result = await findContract("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("updateContract", () => {
    it("updates contract fields", async () => {
      const contracts: ContractRecord[] = [
        { id: "c1", caseCode: "PI-001", clientName: "John", clientEmail: "j@t.com", templateName: "Standard", status: "draft" },
      ];
      await saveContracts(contracts);

      const result = await updateContract("c1", { status: "sent", sentAt: "2024-01-15" });
      expect(result).not.toBeNull();
      expect(result!.status).toBe("sent");
      expect(result!.sentAt).toBe("2024-01-15");

      // Verify persisted
      const saved = await findContract("c1");
      expect(saved!.status).toBe("sent");
    });

    it("returns null for non-existent id", async () => {
      const result = await updateContract("nonexistent", { status: "sent" });
      expect(result).toBeNull();
    });
  });

  describe("generateContractPdf", () => {
    it("generates a PDF file and returns path", async () => {
      const pdfPath = await generateContractPdf("test-contract-1", {
        caseCode: "PI-001",
        clientName: "Test Client",
        clientEmail: "test@example.com",
        templateName: "Standard Investigation",
      });

      expect(pdfPath).toContain("test-contract-1.pdf");
      const stat = await fs.stat(pdfPath);
      expect(stat.size).toBeGreaterThan(0);
    });

    it("generates PDF with custom options", async () => {
      const pdfPath = await generateContractPdf("test-contract-2", {
        caseCode: "PI-002",
        clientName: "Custom Client",
        clientEmail: "custom@example.com",
        templateName: "Custom Template",
        companyName: "Custom PI, LLC",
        companyAddress: "New York, NY",
        effectiveDate: "01/01/2025",
        scopeOfWork: "Custom scope of work",
        retainerAmount: "10,000.00",
        hourlyRate: "200.00",
      });

      expect(pdfPath).toContain("test-contract-2.pdf");
      const stat = await fs.stat(pdfPath);
      expect(stat.size).toBeGreaterThan(0);
    });
  });

  describe("queueContractEmails", () => {
    it("writes email entries to queue file", async () => {
      // Clear queue
      try { await fs.unlink(TEST_EMAIL_QUEUE); } catch {}

      await queueContractEmails("c1", "client@test.com", "office@test.com", "/path/to/contract.pdf");

      const raw = await fs.readFile(TEST_EMAIL_QUEUE, "utf8");
      const lines = raw.trim().split("\n");
      expect(lines).toHaveLength(2);

      const clientEmail = JSON.parse(lines[0]);
      expect(clientEmail.to).toBe("client@test.com");
      expect(clientEmail.subject).toContain("c1");
      expect(clientEmail.attachmentPath).toBe("/path/to/contract.pdf");

      const officeEmail = JSON.parse(lines[1]);
      expect(officeEmail.to).toBe("office@test.com");
      expect(officeEmail.subject).toContain("c1");
    });
  });
});
