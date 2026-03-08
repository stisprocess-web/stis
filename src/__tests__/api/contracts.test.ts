// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";

// We test contract API routes against real file I/O (they use the contracts lib)
// but we need to ensure we clean up after ourselves

import { NextRequest } from "next/server";

const DATA_DIR = path.join(process.cwd(), "data");
const CONTRACTS_FILE = path.join(DATA_DIR, "contracts.json");

describe("contracts API routes", () => {
  let originalContracts: string | null = null;

  beforeEach(async () => {
    try {
      originalContracts = await fs.readFile(CONTRACTS_FILE, "utf8");
    } catch {
      originalContracts = null;
    }
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(CONTRACTS_FILE, "[]", "utf8");
  });

  afterEach(async () => {
    if (originalContracts !== null) {
      await fs.writeFile(CONTRACTS_FILE, originalContracts, "utf8");
    } else {
      try { await fs.unlink(CONTRACTS_FILE); } catch {}
    }
    // Clean test PDFs
    const contractsDir = path.join(DATA_DIR, "contracts");
    try {
      const files = await fs.readdir(contractsDir);
      for (const f of files) {
        if (f.startsWith("CTR-")) await fs.unlink(path.join(contractsDir, f));
      }
    } catch {}
  });

  describe("POST /api/contracts/create", () => {
    it("creates contract and generates PDF", async () => {
      const { POST } = await import("@/app/api/contracts/create/route");

      const formData = new FormData();
      formData.set("caseCode", "PI-001");
      formData.set("clientName", "Test Client");
      formData.set("clientEmail", "test@example.com");
      formData.set("templateName", "Standard");

      const req = new NextRequest("http://localhost:3000/api/contracts/create", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      // Should redirect to /contracts
      expect(res.status).toBe(307); // redirect

      const contracts = JSON.parse(await fs.readFile(CONTRACTS_FILE, "utf8"));
      expect(contracts.length).toBeGreaterThanOrEqual(1);
      const created = contracts.find((c: { clientName: string }) => c.clientName === "Test Client");
      expect(created).toBeDefined();
      expect(created.status).toBe("draft");
    });

    it("returns 400 for missing required fields", async () => {
      const { POST } = await import("@/app/api/contracts/create/route");

      const formData = new FormData();
      formData.set("caseCode", "PI-001");
      // Missing clientName, clientEmail, templateName

      const req = new NextRequest("http://localhost:3000/api/contracts/create", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid email", async () => {
      const { POST } = await import("@/app/api/contracts/create/route");

      const formData = new FormData();
      formData.set("caseCode", "PI-001");
      formData.set("clientName", "Test");
      formData.set("clientEmail", "not-an-email");
      formData.set("templateName", "Standard");

      const req = new NextRequest("http://localhost:3000/api/contracts/create", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/contracts/send", () => {
    it("marks contract as sent", async () => {
      const { POST } = await import("@/app/api/contracts/send/route");

      // Set up a draft contract
      await fs.writeFile(CONTRACTS_FILE, JSON.stringify([{
        id: "c1",
        caseCode: "PI-001",
        clientName: "Test",
        clientEmail: "t@t.com",
        templateName: "Standard",
        status: "draft",
      }]));

      const formData = new FormData();
      formData.set("contractId", "c1");

      const req = new NextRequest("http://localhost:3000/api/contracts/send", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      expect(res.status).toBe(307); // redirect

      const contracts = JSON.parse(await fs.readFile(CONTRACTS_FILE, "utf8"));
      expect(contracts[0].status).toBe("sent");
      expect(contracts[0].sentAt).toBeDefined();
    });

    it("returns 404 for non-existent contract", async () => {
      const { POST } = await import("@/app/api/contracts/send/route");

      const formData = new FormData();
      formData.set("contractId", "nonexistent");

      const req = new NextRequest("http://localhost:3000/api/contracts/send", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      expect(res.status).toBe(404);
    });

    it("returns 400 for already signed contract", async () => {
      const { POST } = await import("@/app/api/contracts/send/route");

      await fs.writeFile(CONTRACTS_FILE, JSON.stringify([{
        id: "c1", caseCode: "PI-001", clientName: "Test", clientEmail: "t@t.com",
        templateName: "Standard", status: "signed",
      }]));

      const formData = new FormData();
      formData.set("contractId", "c1");

      const req = new NextRequest("http://localhost:3000/api/contracts/send", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/contracts/mark-signed", () => {
    it("marks contract as signed and queues emails", async () => {
      const { POST } = await import("@/app/api/contracts/mark-signed/route");

      await fs.writeFile(CONTRACTS_FILE, JSON.stringify([{
        id: "c1", caseCode: "PI-001", clientName: "Test", clientEmail: "client@t.com",
        templateName: "Standard", status: "sent", pdfPath: "/data/contracts/c1.pdf",
      }]));

      const formData = new FormData();
      formData.set("contractId", "c1");
      formData.set("officeEmail", "office@t.com");

      const req = new NextRequest("http://localhost:3000/api/contracts/mark-signed", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      expect(res.status).toBe(307);

      const contracts = JSON.parse(await fs.readFile(CONTRACTS_FILE, "utf8"));
      expect(contracts[0].status).toBe("signed");
      expect(contracts[0].signedAt).toBeDefined();
    });

    it("returns 400 if missing contractId or officeEmail", async () => {
      const { POST } = await import("@/app/api/contracts/mark-signed/route");

      const formData = new FormData();
      formData.set("contractId", "c1");
      // Missing officeEmail

      const req = new NextRequest("http://localhost:3000/api/contracts/mark-signed", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid office email", async () => {
      const { POST } = await import("@/app/api/contracts/mark-signed/route");

      const formData = new FormData();
      formData.set("contractId", "c1");
      formData.set("officeEmail", "invalid-email");

      const req = new NextRequest("http://localhost:3000/api/contracts/mark-signed", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 for already signed contract", async () => {
      const { POST } = await import("@/app/api/contracts/mark-signed/route");

      await fs.writeFile(CONTRACTS_FILE, JSON.stringify([{
        id: "c1", caseCode: "PI-001", clientName: "Test", clientEmail: "t@t.com",
        templateName: "Standard", status: "signed",
      }]));

      const formData = new FormData();
      formData.set("contractId", "c1");
      formData.set("officeEmail", "office@t.com");

      const req = new NextRequest("http://localhost:3000/api/contracts/mark-signed", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });
});
