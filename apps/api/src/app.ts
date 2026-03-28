import cors from "cors";
import express from "express";
import { mkdir } from "fs/promises";
import path from "path";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { analyticsRouter } from "./routes/analyticsRoutes.js";
import { authRouter } from "./routes/authRoutes.js";
import { chatRouter } from "./routes/chatRoutes.js";
import { companyRouter } from "./routes/companyRoutes.js";
import { productRouter } from "./routes/productRoutes.js";
import { uploadRouter } from "./routes/uploadRoutes.js";

// Ensure uploads directory exists on startup
await mkdir(path.resolve(env.UPLOADS_DIR, "products", "original"), { recursive: true });
await mkdir(path.resolve(env.UPLOADS_DIR, "products", "thumb"), { recursive: true });

export const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL
  })
);
app.use(express.json());

// Serve uploaded images as static files
app.use("/uploads", express.static(path.resolve(env.UPLOADS_DIR)));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/companies", companyRouter);
app.use("/products", productRouter);
app.use("/chat", chatRouter);
app.use("/analytics", analyticsRouter);
app.use("/upload", uploadRouter);

app.use(notFound);
app.use(errorHandler);
