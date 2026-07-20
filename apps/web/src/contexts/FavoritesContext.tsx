import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren
} from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "./AuthContext";

interface FavoritesContextValue {
  favoriteIds: Set<string>;
  isFavorite: (productId: string) => boolean;
  /** Alterna o favorito. Retorna false se o usuário não está logado (a UI trata o login). */
  toggle: (productId: string) => Promise<boolean>;
  canFavorite: boolean;
  refresh: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: PropsWithChildren) {
  const { token, user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!token) {
      setFavoriteIds(new Set());
      return;
    }
    try {
      const res = await apiFetch<{ productIds: string[] }>("/favorites/ids", { token });
      setFavoriteIds(new Set(res.productIds));
    } catch {
      setFavoriteIds(new Set());
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh, user?.id]);

  const toggle = useCallback(
    async (productId: string) => {
      if (!token) return false;

      const isFav = favoriteIds.has(productId);

      // Atualização otimista
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(productId);
        else next.add(productId);
        return next;
      });

      try {
        await apiFetch(`/favorites/${productId}`, {
          method: isFav ? "DELETE" : "POST",
          token
        });
      } catch {
        // Reverte em caso de falha
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (isFav) next.add(productId);
          else next.delete(productId);
          return next;
        });
      }
      return true;
    },
    [token, favoriteIds]
  );

  const value: FavoritesContextValue = {
    favoriteIds,
    isFavorite: (id) => favoriteIds.has(id),
    toggle,
    canFavorite: Boolean(user),
    refresh
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
}
