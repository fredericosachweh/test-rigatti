import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct
} from "../controllers/productController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

export const productRouter = Router();

productRouter.use(requireAuth);
productRouter.get("/", listProducts);
productRouter.get("/:id", getProduct);
productRouter.post("/", requireRole("admin"), createProduct);
productRouter.put("/:id", requireRole("admin"), updateProduct);
productRouter.delete("/:id", requireRole("admin"), deleteProduct);
