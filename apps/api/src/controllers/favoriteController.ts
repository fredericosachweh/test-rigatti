import { Favorite } from "../models/Favorite.js";
import { Product } from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/http.js";

/** Lista as motos favoritadas pelo usuário autenticado (com dados completos). */
export const listFavorites = asyncHandler(async (req, res) => {
  const favorites = await Favorite.find({ userId: req.user!.userId })
    .sort({ createdAt: -1 })
    .populate({ path: "productId", populate: { path: "companyId", select: "name slug" } });

  // Ignora favoritos cujo produto foi removido
  const products = favorites.map((fav) => fav.productId).filter((product) => product != null);

  res.json({ products });
});

/** Retorna apenas os ids dos produtos favoritados (para hidratar a UI). */
export const listFavoriteIds = asyncHandler(async (req, res) => {
  const favorites = await Favorite.find({ userId: req.user!.userId }, "productId");
  res.json({ productIds: favorites.map((fav) => fav.productId.toString()) });
});

export const addFavorite = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId, "_id");
  if (!product) {
    throw new HttpError(404, "Moto nao encontrada.");
  }

  await Favorite.updateOne(
    { userId: req.user!.userId, productId },
    { $setOnInsert: { userId: req.user!.userId, productId } },
    { upsert: true }
  );

  res.status(201).json({ productId });
});

export const removeFavorite = asyncHandler(async (req, res) => {
  await Favorite.deleteOne({ userId: req.user!.userId, productId: req.params.productId });
  res.status(204).send();
});
