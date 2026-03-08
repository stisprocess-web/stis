// @vitest-environment node
import { describe, it, expect } from "vitest";
import { canWriteTime, canApproveExpenses, canManageContracts, canSubmitExpenses } from "@/lib/auth";

describe("auth", () => {
  describe("canWriteTime", () => {
    it("returns true for owner", () => expect(canWriteTime("owner")).toBe(true));
    it("returns true for admin", () => expect(canWriteTime("admin")).toBe(true));
    it("returns true for investigator", () => expect(canWriteTime("investigator")).toBe(true));
    it("returns false for billing", () => expect(canWriteTime("billing")).toBe(false));
    it("returns false for client", () => expect(canWriteTime("client")).toBe(false));
  });

  describe("canApproveExpenses", () => {
    it("returns true for owner", () => expect(canApproveExpenses("owner")).toBe(true));
    it("returns true for admin", () => expect(canApproveExpenses("admin")).toBe(true));
    it("returns true for billing", () => expect(canApproveExpenses("billing")).toBe(true));
    it("returns false for investigator", () => expect(canApproveExpenses("investigator")).toBe(false));
    it("returns false for client", () => expect(canApproveExpenses("client")).toBe(false));
  });

  describe("canManageContracts", () => {
    it("returns true for owner", () => expect(canManageContracts("owner")).toBe(true));
    it("returns true for admin", () => expect(canManageContracts("admin")).toBe(true));
    it("returns true for billing", () => expect(canManageContracts("billing")).toBe(true));
    it("returns false for investigator", () => expect(canManageContracts("investigator")).toBe(false));
    it("returns false for client", () => expect(canManageContracts("client")).toBe(false));
  });

  describe("canSubmitExpenses", () => {
    it("returns true for owner", () => expect(canSubmitExpenses("owner")).toBe(true));
    it("returns true for admin", () => expect(canSubmitExpenses("admin")).toBe(true));
    it("returns true for investigator", () => expect(canSubmitExpenses("investigator")).toBe(true));
    it("returns false for billing", () => expect(canSubmitExpenses("billing")).toBe(false));
    it("returns false for client", () => expect(canSubmitExpenses("client")).toBe(false));
  });

  describe("getRoleFromRequest", () => {
    it("returns role from valid session cookie", async () => {
      const { createSessionToken } = await import("@/lib/session");
      const token = await createSessionToken({ userId: "u1", email: "a@b.com", role: "admin" });
      const { NextRequest } = await import("next/server");
      const req = new NextRequest("http://localhost:3000/api/test");
      req.cookies.set("session", token);

      const { getRoleFromRequest } = await import("@/lib/auth");
      const role = await getRoleFromRequest(req);
      expect(role).toBe("admin");
    });

    it("returns client for missing cookie", async () => {
      const { NextRequest } = await import("next/server");
      const req = new NextRequest("http://localhost:3000/api/test");

      const { getRoleFromRequest } = await import("@/lib/auth");
      const role = await getRoleFromRequest(req);
      expect(role).toBe("client");
    });

    it("returns client for invalid cookie", async () => {
      const { NextRequest } = await import("next/server");
      const req = new NextRequest("http://localhost:3000/api/test");
      req.cookies.set("session", "garbage");

      const { getRoleFromRequest } = await import("@/lib/auth");
      const role = await getRoleFromRequest(req);
      expect(role).toBe("client");
    });
  });

  describe("getSessionFromRequest", () => {
    it("returns session payload for valid token", async () => {
      const { createSessionToken } = await import("@/lib/session");
      const token = await createSessionToken({ userId: "u1", email: "a@b.com", role: "owner" });
      const { NextRequest } = await import("next/server");
      const req = new NextRequest("http://localhost:3000/api/test");
      req.cookies.set("session", token);

      const { getSessionFromRequest } = await import("@/lib/auth");
      const session = await getSessionFromRequest(req);
      expect(session).not.toBeNull();
      expect(session!.userId).toBe("u1");
      expect(session!.role).toBe("owner");
    });

    it("returns null for missing cookie", async () => {
      const { NextRequest } = await import("next/server");
      const req = new NextRequest("http://localhost:3000/api/test");

      const { getSessionFromRequest } = await import("@/lib/auth");
      const session = await getSessionFromRequest(req);
      expect(session).toBeNull();
    });
  });
});
