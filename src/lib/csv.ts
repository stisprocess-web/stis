/**
 * @module lib/csv
 * Shared CSV generation utilities for export routes.
 *
 * Provides a type-safe builder to avoid duplicating CSV escaping logic
 * across multiple export endpoints.
 */

import { NextResponse } from "next/server";

/** Escape a value for CSV: wrap in quotes, double any internal quotes. */
function escapeField(value: string | number | null | undefined): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

/**
 * Build a CSV string from a header row and data rows.
 * Each row is an array of field values.
 */
export function buildCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.join(",");
  const dataLines = rows.map((row) => row.map(escapeField).join(","));
  return [headerLine, ...dataLines].join("\n");
}

/**
 * Create a NextResponse with CSV content and download headers.
 * @param csv - The CSV string content.
 * @param filename - The suggested download filename.
 */
export function csvResponse(csv: string, filename: string): NextResponse {
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=${filename}`,
    },
  });
}
