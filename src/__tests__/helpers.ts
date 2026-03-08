/**
 * Shared test helpers and mock factories.
 */
import { NextRequest } from "next/server";
import { vi } from "vitest";

/* ── Prisma mock ─────────────────────────────────────────────────── */

/** Create a fully mocked Prisma client with all model methods. */
export function createMockPrisma() {
  const modelMethods = () => ({
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn().mockResolvedValue({ _sum: {} }),
    groupBy: vi.fn().mockResolvedValue([]),
  });

  return {
    case: modelMethods(),
    client: modelMethods(),
    task: modelMethods(),
    evidence: modelMethods(),
    contractor: modelMethods(),
    timeEntry: modelMethods(),
    expense: modelMethods(),
    invoice: modelMethods(),
    user: modelMethods(),
  };
}

export type MockPrisma = ReturnType<typeof createMockPrisma>;

/* ── NextRequest mock ────────────────────────────────────────────── */

/** Create a mock NextRequest with optional cookies and body. */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    cookies?: Record<string, string>;
    headers?: Record<string, string>;
  } = {},
) {
  const { method = "GET", body, cookies = {}, headers = {} } = options;

  const reqInit: RequestInit = {
    method,
    headers: { "content-type": "application/json", ...headers },
  };

  if (body && method !== "GET") {
    reqInit.body = JSON.stringify(body);
  }

  const req = new NextRequest(new URL(url, "http://localhost:3000"), reqInit);

  for (const [key, value] of Object.entries(cookies)) {
    req.cookies.set(key, value);
  }

  return req;
}

/* ── Session token helper ────────────────────────────────────────── */

/** Create a valid session token for testing. */
export async function createTestToken(
  role: "owner" | "admin" | "investigator" | "billing" | "client" = "owner",
) {
  const { createSessionToken } = await import("@/lib/session");
  return createSessionToken({
    userId: "test-user-id",
    email: `${role}@test.com`,
    role,
  });
}
