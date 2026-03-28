import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { requireAuth } from "../../../middleware/auth.js";
import { signToken } from "../../../utils/jwt.js";

function makeReq(authorization?: string): Request {
  return { headers: { authorization } } as unknown as Request;
}
const mockRes = {} as Response;

describe("requireAuth", () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    next = vi.fn();
  });

  it("calls next(HttpError 401) when no Authorization header", () => {
    requireAuth(makeReq(), mockRes, next as unknown as NextFunction);
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401 });
  });

  it("calls next(HttpError 401) when header does not start with Bearer", () => {
    requireAuth(makeReq("Basic abc"), mockRes, next as unknown as NextFunction);
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401 });
  });

  it("calls next(HttpError 401) for an invalid token", () => {
    requireAuth(makeReq("Bearer bad.token.here"), mockRes, next as unknown as NextFunction);
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401 });
  });

  it("attaches user to req and calls next() with no error for a valid token", () => {
    const token = signToken({
      userId: "u1",
      companyId: "c1",
      role: "admin",
      email: "a@b.com",
      name: "A"
    });
    const req = makeReq(`Bearer ${token}`);
    requireAuth(req, mockRes, next as unknown as NextFunction);
    expect(next).toHaveBeenCalledWith();
    expect((req as any).user).toMatchObject({ userId: "u1", role: "admin" });
  });
});
