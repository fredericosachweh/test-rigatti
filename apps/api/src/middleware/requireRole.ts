import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../models/User.js";
import { HttpError } from "../utils/http.js";

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpError(401, "Usuario nao autenticado."));
    }

    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, "Voce nao tem permissao para esta acao."));
    }

    next();
  };
}
