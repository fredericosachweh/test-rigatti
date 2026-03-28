import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler.js";

const mockReq = {} as Request;
const mockRes = {} as Response;
const mockNext = vi.fn() as unknown as NextFunction;

describe("asyncHandler", () => {
  it("calls the controller with req, res, next", async () => {
    const controller = vi.fn().mockResolvedValue(undefined);
    const handler = asyncHandler(controller);
    await handler(mockReq, mockRes, mockNext);
    expect(controller).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
  });

  it("passes errors to next()", async () => {
    const next = vi.fn();
    const error = new Error("boom");
    const controller = vi.fn().mockRejectedValue(error);
    const handler = asyncHandler(controller);
    await handler(mockReq, mockRes, next as unknown as NextFunction);
    expect(next).toHaveBeenCalledWith(error);
  });

  it("does not call next when controller resolves", async () => {
    const next = vi.fn();
    const controller = vi.fn().mockResolvedValue("ok");
    const handler = asyncHandler(controller);
    await handler(mockReq, mockRes, next as unknown as NextFunction);
    expect(next).not.toHaveBeenCalled();
  });
});
