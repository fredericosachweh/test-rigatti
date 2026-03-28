import { randomUUID } from "crypto";
import multer from "multer";
import path from "path";
import sharp from "sharp";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/http.js";

const UPLOADS_DIR = path.resolve(env.UPLOADS_DIR, "products");
const ORIGINAL_DIR = path.join(UPLOADS_DIR, "original");
const THUMB_DIR = path.join(UPLOADS_DIR, "thumb");

// Multer: memory storage, only images, max 10 MB
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Apenas imagens são permitidas."));
    }
    cb(null, true);
  }
});

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new HttpError(400, "Nenhuma imagem enviada.");
  }

  const id = randomUUID();
  const originalFilename = `${id}.webp`;
  const thumbFilename = `${id}_thumb.webp`;

  await sharp(req.file.buffer)
    .resize(900, 600, { fit: "cover", position: "centre" })
    .webp({ quality: 85 })
    .toFile(path.join(ORIGINAL_DIR, originalFilename));

  await sharp(req.file.buffer)
    .resize(400, 267, { fit: "cover", position: "centre" })
    .webp({ quality: 75 })
    .toFile(path.join(THUMB_DIR, thumbFilename));

  res.json({
    imageUrl: `/uploads/products/original/${originalFilename}`,
    thumbnailUrl: `/uploads/products/thumb/${thumbFilename}`
  });
});
