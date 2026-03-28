import { Router } from "express";
import { chat } from "../controllers/chatController.js";
import { requireAuth } from "../middleware/auth.js";

export const chatRouter = Router();

chatRouter.post("/", requireAuth, chat);
