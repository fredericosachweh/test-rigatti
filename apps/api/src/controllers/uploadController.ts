import { randomUUID } from "crypto";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import path from "path";
import sharp from "sharp";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/http.js";

const UPLOADS_DIR = path.resolve(env.UPLOADS_DIR, "products");
const ORIGINAL_DIR = path.join(UPLOADS_DIR, "original");
const THUMB_DIR = path.join(UPLOADS_DIR, "thumb");

// Cloudinary é usado quando as 3 credenciais estão definidas (armazenamento
// persistente em produção). Sem elas, cai no disco local (desenvolvimento).
const useCloudinary = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

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

function uploadBufferToCloudinary(buffer: Buffer, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "modena/products", public_id: publicId, resource_type: "image", format: "webp" },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Falha no upload."));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new HttpError(400, "Nenhuma imagem enviada.");
  }

  const id = randomUUID();

  const originalBuffer = await sharp(req.file.buffer)
    .resize(900, 600, { fit: "cover", position: "centre" })
    .webp({ quality: 85 })
    .toBuffer();

  const thumbBuffer = await sharp(req.file.buffer)
    .resize(400, 267, { fit: "cover", position: "centre" })
    .webp({ quality: 75 })
    .toBuffer();

  if (useCloudinary) {
    const [imageUrl, thumbnailUrl] = await Promise.all([
      uploadBufferToCloudinary(originalBuffer, id),
      uploadBufferToCloudinary(thumbBuffer, `${id}_thumb`)
    ]);
    return res.json({ imageUrl, thumbnailUrl });
  }

  // Fallback: disco local (desenvolvimento)
  const { writeFile } = await import("fs/promises");
  const originalFilename = `${id}.webp`;
  const thumbFilename = `${id}_thumb.webp`;
  await writeFile(path.join(ORIGINAL_DIR, originalFilename), originalBuffer);
  await writeFile(path.join(THUMB_DIR, thumbFilename), thumbBuffer);

  res.json({
    imageUrl: `/uploads/products/original/${originalFilename}`,
    thumbnailUrl: `/uploads/products/thumb/${thumbFilename}`
  });
});
