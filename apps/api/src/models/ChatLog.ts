import { Schema, model } from "mongoose";

export interface IChatLog {
  companyId: string;
  userId: string;
  message: string;
  toolArgs: Record<string, unknown> | null;
  answer: string;
  provider: string;
  createdAt: Date;
}

const chatLogSchema = new Schema<IChatLog>(
  {
    companyId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    message: { type: String, required: true },
    toolArgs: { type: Schema.Types.Mixed, default: null },
    answer: { type: String, required: true },
    provider: { type: String, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ChatLog = model<IChatLog>("ChatLog", chatLogSchema);
