import { Schema, Types, model } from "mongoose";

export type UserRole = "admin" | "cliente";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  companyId?: Types.ObjectId;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["admin", "cliente"],
      required: true,
      default: "cliente"
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: false,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
         
        delete (ret as Record<string, unknown>).passwordHash;
        return ret;
      }
    }
  }
);

export const User = model<IUser>("User", userSchema);
