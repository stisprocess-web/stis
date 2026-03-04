// @vitest-environment node
import { describe, it, expect } from "vitest";
import { createSessionToken, verifySessionToken } from "@/lib/session";

describe("session", () => {
  const payload = { userId: "u1", email: "test@test.com", role: "owner" as const };

  describe("createSessionToken", () => {
    it("creates a valid JWT string", async () => {
      const token = await createSessionToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe("verifySessionToken", () => {
    it("verifies a valid token and returns payload", async () => {
      const token = await createSessionToken(payload);
      const result = await verifySessionToken(token);
      expect(result).not.toBeNull();
      expect(result!.userId).toBe("u1");
      expect(result!.email).toBe("test@test.com");
      expect(result!.role).toBe("owner");
    });

    it("returns null for undefined token", async () => {
      const result = await verifySessionToken(undefined);
      expect(result).toBeNull();
    });

    it("returns null for empty string", async () => {
      const result = await verifySessionToken("");
      expect(result).toBeNull();
    });

    it("returns null for invalid token", async () => {
      const result = await verifySessionToken("invalid.token.string");
      expect(result).toBeNull();
    });

    it("returns null for tampered token", async () => {
      const token = await createSessionToken(payload);
      const tampered = token.slice(0, -5) + "XXXXX";
      const result = await verifySessionToken(tampered);
      expect(result).toBeNull();
    });

    it("preserves all role types", async () => {
      const roles = ["owner", "admin", "investigator", "billing", "client"] as const;
      for (const role of roles) {
        const token = await createSessionToken({ ...payload, role });
        const result = await verifySessionToken(token);
        expect(result!.role).toBe(role);
      }
    });
  });
});
