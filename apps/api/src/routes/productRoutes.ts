import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct
} from "../controllers/productController.js";
import { requireAuth } from "../middleware/auth.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import { requireRole } from "../middleware/requireRole.js";

export const productRouter = Router();

// Leitura pública do catálogo (visitantes anônimos e clientes)
productRouter.get("/", optionalAuth, listProducts);
productRouter.get("/:id", optionalAuth, getProduct);

// Gestão restrita a administradores
productRouter.post("/", requireAuth, requireRole("admin"), createProduct);
productRouter.put("/:id", requireAuth, requireRole("admin"), updateProduct);
productRouter.delete("/:id", requireAuth, requireRole("admin"), deleteProduct);
