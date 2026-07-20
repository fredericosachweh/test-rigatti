import { Schema, model } from "mongoose";

const favoriteSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Um usuário não pode favoritar a mesma moto duas vezes
favoriteSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const Favorite = model("Favorite", favoriteSchema);
