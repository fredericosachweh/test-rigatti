import { describe, expect, it } from "vitest";
import { signToken, verifyToken } from "../../../utils/jwt.js";

const payload = {
  userId: "user-id-123",
  companyId: "company-id-456",
  role: "admin" as const,
  email: "test@example.com",
  name: "Test User"
};

describe("signToken", () => {
  it("returns a non-empty JWT string", () => {
    const token = signToken(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("embeds the payload in the token", () => {
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.companyId).toBe(payload.companyId);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.name).toBe(payload.name);
  });
});

describe("verifyToken", () => {
  it("decodes a valid token", () => {
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
  });

  it("throws on a tampered token", () => {
    const token = signToken(payload);
    const tampered = token.slice(0, -4) + "xxxx";
    expect(() => verifyToken(tampered)).toThrow();
  });

  it("throws on a completely invalid string", () => {
    expect(() => verifyToken("not.a.jwt")).toThrow();
  });
});
