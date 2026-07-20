import { Router } from "express";
import { Company } from "../models/Company.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const companyRouter = Router();

// Lista pública de unidades — usada no filtro do catálogo público
companyRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const companies = await Company.find({}, "name slug").sort({ name: 1 });
    res.json({ companies });
  })
);
