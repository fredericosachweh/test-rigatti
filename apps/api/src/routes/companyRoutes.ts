import { Router } from "express";
import { Company } from "../models/Company.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const companyRouter = Router();

companyRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const companies = await Company.find({}, "name slug").sort({ name: 1 });
    res.json({ companies });
  })
);
