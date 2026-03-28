import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.js";
import { HttpError } from "../utils/http.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(new HttpError(401, "Token ausente ou invalido."));
  }

  const token = header.replace("Bearer ", "");

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new HttpError(401, "Sessao expirada ou token invalido."));
  }
}
