import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { requireRole } from "../../../middleware/requireRole.js";
import type { JwtPayload } from "../../../utils/jwt.js";

const mockRes = {} as Response;

function makeReq(user?: Partial<JwtPayload>): Request {
  return { user } as unknown as Request;
}

describe("requireRole", () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    next = vi.fn();
  });

  it("calls next(401) when req.user is missing", () => {
    requireRole("admin")(makeReq(), mockRes, next as unknown as NextFunction);
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401 });
  });

  it("calls next(403) when user role does not match", () => {
    requireRole("admin")(makeReq({ role: "cliente" }), mockRes, next as unknown as NextFunction);
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 403 });
  });

  it("calls next() with no error when role matches", () => {
    requireRole("admin")(makeReq({ role: "admin" }), mockRes, next as unknown as NextFunction);
    expect(next).toHaveBeenCalledWith();
  });

  it("allows any of multiple accepted roles", () => {
    requireRole("admin", "cliente")(
      makeReq({ role: "cliente" }),
      mockRes,
      next as unknown as NextFunction
    );
    expect(next).toHaveBeenCalledWith();
  });
});
