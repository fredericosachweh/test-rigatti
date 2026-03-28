import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { HttpError } from "../utils/http.js";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({
    message: "Rota nao encontrada."
  });
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Dados invalidos.",
      issues: error.flatten()
    });
  }

  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      message: error.message
    });
  }

  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      message: "Identificador invalido."
    });
  }

  if (error instanceof Error && "code" in error && error.code === 11000) {
    return res.status(409).json({
      message: "Registro duplicado."
    });
  }

  console.error(error);

  return res.status(500).json({
    message: "Erro interno do servidor."
  });
}
