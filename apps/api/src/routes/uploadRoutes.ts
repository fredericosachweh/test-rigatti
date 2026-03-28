import { Router } from "express";
import { imageUpload, uploadImage } from "../controllers/uploadController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

export const uploadRouter = Router();

uploadRouter.post(
  "/image",
  requireAuth,
  requireRole("admin"),
  imageUpload.single("image"),
  uploadImage
);
