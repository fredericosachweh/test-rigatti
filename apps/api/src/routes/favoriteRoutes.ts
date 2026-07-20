import { Router } from "express";
import {
  addFavorite,
  listFavoriteIds,
  listFavorites,
  removeFavorite
} from "../controllers/favoriteController.js";
import { requireAuth } from "../middleware/auth.js";

export const favoriteRouter = Router();

favoriteRouter.use(requireAuth);
favoriteRouter.get("/", listFavorites);
favoriteRouter.get("/ids", listFavoriteIds);
favoriteRouter.post("/:productId", addFavorite);
favoriteRouter.delete("/:productId", removeFavorite);
