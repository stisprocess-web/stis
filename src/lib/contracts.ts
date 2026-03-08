/**
 * @module lib/contracts
 * Contract lifecycle management — create, generate PDF, track signatures, store files.
 *
 * Uses a local JSON file store (data/contracts.json) for contract metadata
 * and `pdf-lib` for all PDF generation. No third-party signature services.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/* ── Types ─────────────────────────────────────────────────────────── */

export type ContractStatus = "draft" | "sent" | "signed";

export interface ContractRecord {
  id: string;
  caseCode: string;
  clientName: string;
  clientEmail: string;
  templateName: string;
  status: ContractStatus;
  pdfPath?: string;
  sentAt?: string;
  signedAt?: string;
  signedCopyPath?: string;
}

/* ── Storage ───────────────────────────────────────────────────────── */

const DATA_DIR = path.join(process.cwd(), "data");
const CONTRACTS_DIR = path.join(DATA_DIR, "contracts");
const DATA_FILE = path.join(DATA_DIR, "contracts.json");

/** Ensure the data and contracts directories and JSON file exist. */
async function ensureStore(): Promise<void> {
  await fs.mkdir(CONTRACTS_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

/** Read all contract records from the JSON store. */
export async function listContracts(): Promise<ContractRecord[]> {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw) as ContractRecord[];
}

/** Persist the full contracts array back to the JSON store. */
export async function saveContracts(rows: ContractRecord[]): Promise<void> {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(rows, null, 2), "utf8");
}

/** Find a single contract by ID, or null if not found. */
export async function findContract(id: string): Promise<ContractRecord | null> {
  const rows = await listContracts();
  return rows.find((r) => r.id === id) ?? null;
}

/** Update a contract record in-place and persist. */
export async function updateContract(
  id: string,
  updates: Partial<ContractRecord>,
): Promise<ContractRecord | null> {
  const rows = await listContracts();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  rows[idx] = { ...rows[idx], ...updates };
  await saveContracts(rows);
  return rows[idx];
}

/* ── PDF Generation ────────────────────────────────────────────────── */

/** Options for generating a contract PDF. */
export interface ContractPdfOptions {
  caseCode: string;
  clientName: string;
  clientEmail: string;
  templateName: string;
  companyName?: string;
  companyAddress?: string;
  effectiveDate?: string;
  scopeOfWork?: string;
  retainerAmount?: string;
  hourlyRate?: string;
}

/**
 * Generate a professional contract PDF with signature and initial blocks.
 *
 * Uses pdf-lib for pure JS PDF generation — no external services.
 * Returns the absolute path to the generated file.
 */
export async function generateContractPdf(
  contractId: string,
  options: ContractPdfOptions,
): Promise<string> {
  await ensureStore();

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 11;
  const lineHeight = 16;
  const margin = 60;

  const companyName = options.companyName || "Leaird Private Investigations, LLC";
  const companyAddr = options.companyAddress || "Charleston, SC";
  const effectiveDate = options.effectiveDate || new Date().toLocaleDateString("en-US");
  const scopeOfWork =
    options.scopeOfWork ||
    "Professional investigative services as detailed in the case file, including but not limited to " +
      "surveillance, background research, witness interviews, evidence collection, and report preparation.";
  const retainer = options.retainerAmount || "5,000.00";
  const rate = options.hourlyRate || "125.00";

  // Helper to add a page and return drawing context
  function addPage() {
    const page = doc.addPage([612, 792]); // US Letter
    return { page, y: 792 - margin };
  }

  // Helper to draw text with word-wrap
  function drawWrapped(
    page: ReturnType<typeof doc.addPage>,
    text: string,
    startY: number,
    opts: { font: typeof font; size: number; maxWidth: number; color?: ReturnType<typeof rgb> },
  ): number {
    const words = text.split(" ");
    let line = "";
    let y = startY;

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const width = opts.font.widthOfTextAtSize(testLine, opts.size);
      if (width > opts.maxWidth && line) {
        page.drawText(line, { x: margin, y, font: opts.font, size: opts.size, color: opts.color });
        y -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) {
      page.drawText(line, { x: margin, y, font: opts.font, size: opts.size, color: opts.color });
      y -= lineHeight;
    }
    return y;
  }

  // ── Page 1: Contract body ──
  const { page, y: initialY } = addPage();
  let y = initialY;
  const pageWidth = 612 - margin * 2;

  // Header
  page.drawText(companyName, { x: margin, y, font: fontBold, size: 16, color: rgb(0.1, 0.1, 0.1) });
  y -= 18;
  page.drawText(companyAddr, { x: margin, y, font, size: 9, color: rgb(0.4, 0.4, 0.4) });
  y -= 30;

  // Title
  page.drawText("PROFESSIONAL SERVICES AGREEMENT", {
    x: margin,
    y,
    font: fontBold,
    size: 14,
    color: rgb(0.15, 0.15, 0.15),
  });
  y -= 10;
  page.drawLine({ start: { x: margin, y }, end: { x: 612 - margin, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  y -= 25;

  // Contract details
  const details = [
    ["Contract ID:", contractId],
    ["Case Reference:", options.caseCode],
    ["Template:", options.templateName],
    ["Effective Date:", effectiveDate],
    ["Client:", `${options.clientName} (${options.clientEmail})`],
  ];

  for (const [label, value] of details) {
    page.drawText(label, { x: margin, y, font: fontBold, size: fontSize, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(value, { x: margin + 120, y, font, size: fontSize, color: rgb(0.1, 0.1, 0.1) });
    y -= lineHeight + 2;
  }
  y -= 10;

  // Section 1
  page.drawText("1. SCOPE OF SERVICES", { x: margin, y, font: fontBold, size: 12 });
  y -= lineHeight + 2;
  y = drawWrapped(page, scopeOfWork, y, { font, size: fontSize, maxWidth: pageWidth });
  y -= 10;

  // Section 2
  page.drawText("2. COMPENSATION", { x: margin, y, font: fontBold, size: 12 });
  y -= lineHeight + 2;
  y = drawWrapped(
    page,
    `Client agrees to pay an initial retainer of $${retainer} USD upon execution of this agreement. ` +
      `Hourly services will be billed at $${rate}/hour. Expenses incurred during the investigation ` +
      `(mileage, equipment, lodging, etc.) will be billed at cost with receipts provided.`,
    y,
    { font, size: fontSize, maxWidth: pageWidth },
  );
  y -= 10;

  // Section 3
  page.drawText("3. CONFIDENTIALITY", { x: margin, y, font: fontBold, size: 12 });
  y -= lineHeight + 2;
  y = drawWrapped(
    page,
    "All information obtained during the course of investigation shall remain strictly confidential. " +
      "Neither party shall disclose case details, evidence, or findings to any third party without " +
      "written consent, except as required by law or court order.",
    y,
    { font, size: fontSize, maxWidth: pageWidth },
  );
  y -= 10;

  // Section 4
  page.drawText("4. TERM AND TERMINATION", { x: margin, y, font: fontBold, size: 12 });
  y -= lineHeight + 2;
  y = drawWrapped(
    page,
    "This agreement is effective as of the date signed below and continues until the investigation " +
      "is completed or terminated by either party with 7 days written notice. Upon termination, " +
      "Client is responsible for all fees and expenses incurred up to the termination date.",
    y,
    { font, size: fontSize, maxWidth: pageWidth },
  );
  y -= 10;

  // Section 5
  page.drawText("5. LIABILITY LIMITATION", { x: margin, y, font: fontBold, size: 12 });
  y -= lineHeight + 2;
  y = drawWrapped(
    page,
    `${companyName} shall not be liable for any indirect, incidental, or consequential damages. ` +
      "Total liability shall not exceed the total fees paid under this agreement.",
    y,
    { font, size: fontSize, maxWidth: pageWidth },
  );

  // ── Page 2: Signature blocks ──
  const page2Data = addPage();
  const sigPage = page2Data.page;
  let sy = page2Data.y;

  sigPage.drawText("SIGNATURE PAGE", { x: margin, y: sy, font: fontBold, size: 14 });
  sy -= 10;
  sigPage.drawLine({
    start: { x: margin, y: sy },
    end: { x: 612 - margin, y: sy },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  sy -= 30;

  sigPage.drawText(
    "By signing below, both parties agree to the terms and conditions set forth in this agreement.",
    { x: margin, y: sy, font, size: fontSize },
  );
  sy -= 40;

  // Client signature block
  sigPage.drawText("CLIENT", { x: margin, y: sy, font: fontBold, size: 12 });
  sy -= 25;

  sigPage.drawText("Signature: _______________________________________", {
    x: margin,
    y: sy,
    font,
    size: fontSize,
  });
  sy -= 22;
  sigPage.drawText(`Print Name: ${options.clientName}`, { x: margin, y: sy, font, size: fontSize });
  sy -= 22;
  sigPage.drawText("Date: _________________", { x: margin, y: sy, font, size: fontSize });
  sy -= 15;

  // Initials box
  sigPage.drawRectangle({
    x: 400,
    y: sy + 20,
    width: 80,
    height: 40,
    borderColor: rgb(0.5, 0.5, 0.5),
    borderWidth: 1,
  });
  sigPage.drawText("Initials", {
    x: 420,
    y: sy + 7,
    font,
    size: 8,
    color: rgb(0.5, 0.5, 0.5),
  });
  sy -= 40;

  // Company signature block
  sigPage.drawText(companyName.toUpperCase(), { x: margin, y: sy, font: fontBold, size: 12 });
  sy -= 25;

  sigPage.drawText("Signature: _______________________________________", {
    x: margin,
    y: sy,
    font,
    size: fontSize,
  });
  sy -= 22;
  sigPage.drawText("Print Name: _______________________________________", {
    x: margin,
    y: sy,
    font,
    size: fontSize,
  });
  sy -= 22;
  sigPage.drawText("Title: _______________________________________", { x: margin, y: sy, font, size: fontSize });
  sy -= 22;
  sigPage.drawText("Date: _________________", { x: margin, y: sy, font, size: fontSize });
  sy -= 15;

  // Initials box
  sigPage.drawRectangle({
    x: 400,
    y: sy + 20,
    width: 80,
    height: 40,
    borderColor: rgb(0.5, 0.5, 0.5),
    borderWidth: 1,
  });
  sigPage.drawText("Initials", {
    x: 420,
    y: sy + 7,
    font,
    size: 8,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Footer on both pages
  for (const p of doc.getPages()) {
    p.drawText(`Contract ${contractId} — ${companyName} — CONFIDENTIAL`, {
      x: margin,
      y: 30,
      font,
      size: 7,
      color: rgb(0.6, 0.6, 0.6),
    });
  }

  // Save
  const pdfBytes = await doc.save();
  const filename = `${contractId}.pdf`;
  const filepath = path.join(CONTRACTS_DIR, filename);
  await fs.writeFile(filepath, pdfBytes);

  return filepath;
}

/**
 * Queue email notifications for a signed contract.
 * Writes to data/email_queue.jsonl for async processing by the mail stack.
 */
export async function queueContractEmails(
  contractId: string,
  clientEmail: string,
  officeEmail: string,
  attachmentPath: string,
): Promise<void> {
  const queuePath = path.join(DATA_DIR, "email_queue.jsonl");
  const payloads = [
    {
      to: clientEmail,
      subject: `Your Signed Contract — ${contractId}`,
      body: `Please find attached your fully executed contract (${contractId}). Retain this for your records.`,
      attachmentPath,
      createdAt: new Date().toISOString(),
    },
    {
      to: officeEmail,
      subject: `Office Copy — Signed Contract ${contractId}`,
      body: `Signed contract ${contractId} has been executed and filed. Attached for office records.`,
      attachmentPath,
      createdAt: new Date().toISOString(),
    },
  ];

  for (const p of payloads) {
    await fs.appendFile(queuePath, JSON.stringify(p) + "\n", "utf8");
  }
}
