// @vitest-environment node
/**
 * Workflow test: Create contract → Generate PDF → Mark signed
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";

const DATA_DIR = path.join(process.cwd(), "data");
const CONTRACTS_FILE = path.join(DATA_DIR, "contracts.json");
const EMAIL_QUEUE = path.join(DATA_DIR, "email_queue.jsonl");

describe("workflow: contract lifecycle (create → send → sign)", () => {
  let originalContracts: string | null = null;
  let originalEmailQueue: string | null = null;

  beforeEach(async () => {
    try { originalContracts = await fs.readFile(CONTRACTS_FILE, "utf8"); } catch { originalContracts = null; }
    try { originalEmailQueue = await fs.readFile(EMAIL_QUEUE, "utf8"); } catch { originalEmailQueue = null; }
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(path.join(DATA_DIR, "contracts"), { recursive: true });
    await fs.writeFile(CONTRACTS_FILE, "[]", "utf8");
    try { await fs.unlink(EMAIL_QUEUE); } catch {}
  });

  afterEach(async () => {
    if (originalContracts !== null) await fs.writeFile(CONTRACTS_FILE, originalContracts, "utf8");
    else try { await fs.unlink(CONTRACTS_FILE); } catch {}
    if (originalEmailQueue !== null) await fs.writeFile(EMAIL_QUEUE, originalEmailQueue, "utf8");
    else try { await fs.unlink(EMAIL_QUEUE); } catch {}
    // Clean test PDFs
    try {
      const files = await fs.readdir(path.join(DATA_DIR, "contracts"));
      for (const f of files) {
        if (f.startsWith("CTR-")) await fs.unlink(path.join(DATA_DIR, "contracts", f));
      }
    } catch {}
  });

  it("completes full contract lifecycle: create → send → sign", async () => {
    // Step 1: Create contract and generate PDF
    const { POST: createPOST } = await import("@/app/api/contracts/create/route");
    const createForm = new FormData();
    createForm.set("caseCode", "PI-LIFECYCLE-001");
    createForm.set("clientName", "Lifecycle Client");
    createForm.set("clientEmail", "lifecycle@example.com");
    createForm.set("templateName", "Standard Investigation");

    const createReq = new NextRequest("http://localhost:3000/api/contracts/create", {
      method: "POST",
      body: createForm,
    });
    const createRes = await createPOST(createReq);
    expect(createRes.status).toBe(307); // redirect means success

    // Verify contract was created
    const contractsAfterCreate = JSON.parse(await fs.readFile(CONTRACTS_FILE, "utf8"));
    expect(contractsAfterCreate.length).toBeGreaterThanOrEqual(1);
    const created = contractsAfterCreate.find((c: { caseCode: string }) => c.caseCode === "PI-LIFECYCLE-001");
    expect(created).toBeDefined();
    expect(created.status).toBe("draft");
    expect(created.pdfPath).toBeDefined();

    const contractId = created.id;

    // Verify PDF was generated
    const pdfStat = await fs.stat(created.pdfPath);
    expect(pdfStat.size).toBeGreaterThan(0);

    // Step 2: Send the contract
    const { POST: sendPOST } = await import("@/app/api/contracts/send/route");
    const sendForm = new FormData();
    sendForm.set("contractId", contractId);

    const sendReq = new NextRequest("http://localhost:3000/api/contracts/send", {
      method: "POST",
      body: sendForm,
    });
    const sendRes = await sendPOST(sendReq);
    expect(sendRes.status).toBe(307);

    // Verify contract is now 'sent'
    const contractsAfterSend = JSON.parse(await fs.readFile(CONTRACTS_FILE, "utf8"));
    const sent = contractsAfterSend.find((c: { id: string }) => c.id === contractId);
    expect(sent.status).toBe("sent");
    expect(sent.sentAt).toBeDefined();

    // Step 3: Mark the contract as signed
    const { POST: signPOST } = await import("@/app/api/contracts/mark-signed/route");
    const signForm = new FormData();
    signForm.set("contractId", contractId);
    signForm.set("officeEmail", "office@leairdpi.com");

    const signReq = new NextRequest("http://localhost:3000/api/contracts/mark-signed", {
      method: "POST",
      body: signForm,
    });
    const signRes = await signPOST(signReq);
    expect(signRes.status).toBe(307);

    // Verify contract is now 'signed'
    const contractsAfterSign = JSON.parse(await fs.readFile(CONTRACTS_FILE, "utf8"));
    const signed = contractsAfterSign.find((c: { id: string }) => c.id === contractId);
    expect(signed.status).toBe("signed");
    expect(signed.signedAt).toBeDefined();
    expect(signed.signedCopyPath).toBeDefined();

    // Step 4: Verify email queue was populated
    const emailQueue = await fs.readFile(EMAIL_QUEUE, "utf8");
    const emails = emailQueue.trim().split("\n").map((line) => JSON.parse(line));
    expect(emails.length).toBeGreaterThanOrEqual(2); // at least client + office
    expect(emails[0].to).toBe("lifecycle@example.com");
    expect(emails[1].to).toBe("office@leairdpi.com");
  });
});
