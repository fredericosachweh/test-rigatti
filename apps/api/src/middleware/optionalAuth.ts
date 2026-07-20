import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.js";

/**
 * Popula req.user quando há um token válido, mas nunca bloqueia a requisição.
 * Usado em rotas públicas que se comportam de forma diferente para visitantes
 * anônimos e usuários autenticados (ex.: catálogo público).
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (header?.startsWith("Bearer ")) {
    const token = header.replace("Bearer ", "");
    try {
      req.user = verifyToken(token);
    } catch {
      // token inválido/expirado — segue como visitante anônimo
    }
  }

  next();
}
