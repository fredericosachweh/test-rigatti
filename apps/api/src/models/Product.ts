import { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    brand: {
      type: String,
      required: true,
      trim: true
    },
    model: {
      type: String,
      required: true,
      trim: true
    },
    year: {
      type: Number,
      required: true,
      min: 1950,
      max: 2100
    },
    mileage: {
      type: Number,
      required: true,
      min: 0
    },
    engineCc: {
      type: Number,
      required: true,
      min: 0
    },
    color: {
      type: String,
      required: true,
      trim: true
    },
    images: {
      type: [
        {
          imageUrl: { type: String, required: true, trim: true },
          thumbnailUrl: { type: String, trim: true }
        }
      ],
      validate: {
        validator: (v: unknown[]) => v.length >= 1 && v.length <= 6,
        message: "Produto deve ter entre 1 e 6 imagens."
      },
      required: true
    }
  },
  {
    timestamps: true
  }
);

export const Product = model("Product", productSchema);
