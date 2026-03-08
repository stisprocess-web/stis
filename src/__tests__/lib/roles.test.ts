import { describe, it, expect } from "vitest";
import { roleAllowed, accessPolicy } from "@/lib/roles";
import type { AppRole } from "@/lib/auth";

describe("roles", () => {
  describe("roleAllowed", () => {
    it("returns true when role is in allowed list", () => {
      expect(roleAllowed("owner", ["owner", "admin"])).toBe(true);
    });

    it("returns false when role is not in allowed list", () => {
      expect(roleAllowed("client", ["owner", "admin"])).toBe(false);
    });

    it("returns false for empty allowed list", () => {
      expect(roleAllowed("owner", [])).toBe(false);
    });

    it("matches exact role strings", () => {
      expect(roleAllowed("admin", ["admin"])).toBe(true);
      expect(roleAllowed("investigator", ["admin"])).toBe(false);
    });
  });

  describe("accessPolicy", () => {
    const _allRoles: AppRole[] = ["owner", "admin", "management", "investigator", "billing", "client"];

    it("reporting allows owner, admin, billing only", () => {
      expect(roleAllowed("owner", accessPolicy.reporting)).toBe(true);
      expect(roleAllowed("admin", accessPolicy.reporting)).toBe(true);
      expect(roleAllowed("billing", accessPolicy.reporting)).toBe(true);
      expect(roleAllowed("investigator", accessPolicy.reporting)).toBe(false);
      expect(roleAllowed("client", accessPolicy.reporting)).toBe(false);
    });

    it("team allows owner, admin, investigator, billing", () => {
      expect(roleAllowed("owner", accessPolicy.team)).toBe(true);
      expect(roleAllowed("admin", accessPolicy.team)).toBe(true);
      expect(roleAllowed("investigator", accessPolicy.team)).toBe(true);
      expect(roleAllowed("billing", accessPolicy.team)).toBe(true);
      expect(roleAllowed("client", accessPolicy.team)).toBe(false);
    });

    it("settings allows owner, admin only", () => {
      expect(roleAllowed("owner", accessPolicy.settings)).toBe(true);
      expect(roleAllowed("admin", accessPolicy.settings)).toBe(true);
      expect(roleAllowed("investigator", accessPolicy.settings)).toBe(false);
      expect(roleAllowed("billing", accessPolicy.settings)).toBe(false);
      expect(roleAllowed("client", accessPolicy.settings)).toBe(false);
    });

    it("writeTime allows owner, admin, investigator", () => {
      expect(roleAllowed("owner", accessPolicy.writeTime)).toBe(true);
      expect(roleAllowed("admin", accessPolicy.writeTime)).toBe(true);
      expect(roleAllowed("investigator", accessPolicy.writeTime)).toBe(true);
      expect(roleAllowed("billing", accessPolicy.writeTime)).toBe(false);
      expect(roleAllowed("client", accessPolicy.writeTime)).toBe(false);
    });

    it("expenseApproval allows owner, admin, billing", () => {
      expect(roleAllowed("owner", accessPolicy.expenseApproval)).toBe(true);
      expect(roleAllowed("admin", accessPolicy.expenseApproval)).toBe(true);
      expect(roleAllowed("billing", accessPolicy.expenseApproval)).toBe(true);
      expect(roleAllowed("investigator", accessPolicy.expenseApproval)).toBe(false);
    });

    it("expenseSubmit allows owner, admin, investigator", () => {
      expect(roleAllowed("owner", accessPolicy.expenseSubmit)).toBe(true);
      expect(roleAllowed("admin", accessPolicy.expenseSubmit)).toBe(true);
      expect(roleAllowed("investigator", accessPolicy.expenseSubmit)).toBe(true);
      expect(roleAllowed("billing", accessPolicy.expenseSubmit)).toBe(false);
    });

    it("contracts allows owner, admin, billing", () => {
      expect(roleAllowed("owner", accessPolicy.contracts)).toBe(true);
      expect(roleAllowed("admin", accessPolicy.contracts)).toBe(true);
      expect(roleAllowed("billing", accessPolicy.contracts)).toBe(true);
      expect(roleAllowed("investigator", accessPolicy.contracts)).toBe(false);
    });

    it("caseManagement allows owner, admin", () => {
      expect(roleAllowed("owner", accessPolicy.caseManagement)).toBe(true);
      expect(roleAllowed("admin", accessPolicy.caseManagement)).toBe(true);
      expect(roleAllowed("investigator", accessPolicy.caseManagement)).toBe(false);
      expect(roleAllowed("billing", accessPolicy.caseManagement)).toBe(false);
    });

    it("videoIngest allows owner, admin, investigator", () => {
      expect(roleAllowed("owner", accessPolicy.videoIngest)).toBe(true);
      expect(roleAllowed("admin", accessPolicy.videoIngest)).toBe(true);
      expect(roleAllowed("investigator", accessPolicy.videoIngest)).toBe(true);
      expect(roleAllowed("billing", accessPolicy.videoIngest)).toBe(false);
    });

    it("client role is only allowed for caseView, evidenceView, and dashboard policies", () => {
      const clientAllowed = new Set(["caseView", "evidenceView", "dashboard"]);
      for (const [key, allowed] of Object.entries(accessPolicy)) {
        if (clientAllowed.has(key)) {
          expect(roleAllowed("client", allowed)).toBe(true);
        } else {
          expect(roleAllowed("client", allowed)).toBe(false);
        }
      }
    });

    it("owner role is allowed for all policies", () => {
      for (const [, allowed] of Object.entries(accessPolicy)) {
        expect(roleAllowed("owner", allowed)).toBe(true);
      }
    });
  });
});
