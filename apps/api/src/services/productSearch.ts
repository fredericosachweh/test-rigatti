import { Product } from "../models/Product.js";

export interface ProductSearchInput {
  search?: string;
  category?: string;
  brand?: string;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

export async function searchProductsByCompany(companyId: string, input: ProductSearchInput) {
  const query: Record<string, unknown> = {};

  if (companyId) {
    query.companyId = companyId;
  }

  if (input.category) {
    query.category = { $regex: input.category, $options: "i" };
  }

  if (input.brand) {
    query.brand = { $regex: input.brand, $options: "i" };
  }

  if (input.search) {
    query.$or = [
      { name: { $regex: input.search, $options: "i" } },
      { description: { $regex: input.search, $options: "i" } },
      { category: { $regex: input.search, $options: "i" } },
      { brand: { $regex: input.search, $options: "i" } },
      { model: { $regex: input.search, $options: "i" } },
      { color: { $regex: input.search, $options: "i" } }
    ];
  }

  if (input.minYear !== undefined || input.maxYear !== undefined) {
    query.year = {};
    if (input.minYear !== undefined) {
      (query.year as Record<string, number>).$gte = input.minYear;
    }
    if (input.maxYear !== undefined) {
      (query.year as Record<string, number>).$lte = input.maxYear;
    }
  }

  if (input.minPrice !== undefined || input.maxPrice !== undefined) {
    query.price = {};

    if (input.minPrice !== undefined) {
      (query.price as Record<string, number>).$gte = input.minPrice;
    }

    if (input.maxPrice !== undefined) {
      (query.price as Record<string, number>).$lte = input.maxPrice;
    }
  }

  const limit = Math.min(Math.max(input.limit ?? 6, 1), 12);

  const products = await Product.find(query).sort({ price: 1, createdAt: -1 }).limit(limit).lean();

  return products.map((product) => ({
    id: product._id.toString(),
    name: product.name,
    description: product.description,
    category: product.category,
    brand: product.brand,
    model: product.model,
    year: product.year,
    mileage: product.mileage,
    engineCc: product.engineCc,
    color: product.color,
    price: product.price,
    imageUrl: product.images?.[0]?.imageUrl ?? ""
  }));
}
