import { Router } from "express";
import { getHeatmap } from "../controllers/analyticsController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

export const analyticsRouter = Router();

analyticsRouter.get("/heatmap", requireAuth, requireRole("admin"), getHeatmap);
