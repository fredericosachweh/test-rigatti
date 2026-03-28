import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { runProductAssistant } from "../services/chatService.js";

const chatSchema = z.object({
  message: z.string().min(2)
});

export const chat = asyncHandler(async (req, res) => {
  const { message } = chatSchema.parse(req.body);

  const answer = await runProductAssistant({
    message,
    user: req.user!
  });

  res.json(answer);
});
