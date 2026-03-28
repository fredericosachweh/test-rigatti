import { z } from "zod";
import { Company } from "../models/Company.js";
import { Product } from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/http.js";

const imageSchema = z.object({
  imageUrl: z.string().min(1),
  thumbnailUrl: z.string().optional()
});

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(4),
  price: z.coerce.number().nonnegative(),
  category: z.string().min(2),
  images: z.array(imageSchema).min(1).max(6)
});

const listSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  // accepts repeated ?companySlugs[]=a&companySlugs[]=b or a single string
  companySlugs: z.union([z.array(z.string()), z.string()]).optional()
});

export const listProducts = asyncHandler(async (req, res) => {
  const filters = listSchema.parse(req.query);
  const { role, companyId } = req.user!;

  const query: Record<string, unknown> = {};

  if (role === "admin") {
    query.companyId = companyId;
  } else {
    const slugs = filters.companySlugs
      ? Array.isArray(filters.companySlugs)
        ? filters.companySlugs
        : [filters.companySlugs]
      : [];

    if (slugs.length > 0) {
      const companies = await Company.find(
        { slug: { $in: slugs.map((s) => s.toLowerCase().trim()) } },
        "_id"
      );
      query.companyId = { $in: companies.map((c) => c._id) };
    }
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: "i" } },
      { description: { $regex: filters.search, $options: "i" } },
      { category: { $regex: filters.search, $options: "i" } }
    ];
  }

  const products = await Product.find(query)
    .populate("companyId", "name slug")
    .sort({ createdAt: -1 });

  res.json({ products });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    companyId: req.user!.companyId
  });

  if (!product) {
    throw new HttpError(404, "Produto nao encontrado.");
  }

  res.json({ product });
});

export const createProduct = asyncHandler(async (req, res) => {
  const data = productSchema.parse(req.body);

  const product = await Product.create({
    ...data,
    companyId: req.user!.companyId
  });

  res.status(201).json({ product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const data = productSchema.parse(req.body);

  const product = await Product.findOneAndUpdate(
    {
      _id: req.params.id,
      companyId: req.user!.companyId
    },
    data,
    { new: true }
  );

  if (!product) {
    throw new HttpError(404, "Produto nao encontrado.");
  }

  res.json({ product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({
    _id: req.params.id,
    companyId: req.user!.companyId
  });

  if (!product) {
    throw new HttpError(404, "Produto nao encontrado.");
  }

  res.status(204).send();
});
