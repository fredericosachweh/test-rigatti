import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { errorHandler, notFound } from "../../../middleware/errorHandler.js";
import { HttpError } from "../../../utils/http.js";

function makeRes() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { status, json } as unknown as Response;
}

const mockReq = {} as Request;
const mockNext = vi.fn() as unknown as NextFunction;

describe("notFound", () => {
  it("returns 404 with a message", () => {
    const res = makeRes();
    notFound(mockReq, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("errorHandler", () => {
  it("handles HttpError with correct status", () => {
    const res = makeRes();
    errorHandler(new HttpError(409, "Conflict"), mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("handles ZodError with 400", () => {
    const res = makeRes();
    const zodErr = new ZodError([
      {
        path: ["email"],
        message: "Invalid email",
        code: "invalid_type",
        expected: "string",
        received: "undefined"
      }
    ]);
    errorHandler(zodErr, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("handles mongoose CastError with 400", () => {
    const res = makeRes();
    const castErr = new mongoose.Error.CastError("ObjectId", "bad-id", "_id");
    errorHandler(castErr, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("handles duplicate key error (code 11000) with 409", () => {
    const res = makeRes();
    const dupErr = Object.assign(new Error("duplicate"), { code: 11000 });
    errorHandler(dupErr, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("handles unknown errors with 500", () => {
    const res = makeRes();
    errorHandler(new Error("unexpected"), mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
