import { useNavigate } from "react-router-dom";
import { useFavorites } from "../contexts/FavoritesContext";

interface FavoriteButtonProps {
  productId: string;
  className?: string;
  size?: number;
}

export function FavoriteButton({ productId, className = "", size = 18 }: FavoriteButtonProps) {
  const { isFavorite, toggle, canFavorite } = useFavorites();
  const navigate = useNavigate();
  const active = isFavorite(productId);

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!canFavorite) {
      navigate("/auth");
      return;
    }
    await toggle(productId);
  }

  return (
    <button
      type="button"
      className={`favorite-button ${active ? "favorite-button--active" : ""} ${className}`}
      onClick={handleClick}
      aria-pressed={active}
      title={
        !canFavorite
          ? "Entre para salvar favoritos"
          : active
            ? "Remover dos favoritos"
            : "Salvar nos favoritos"
      }
      aria-label={active ? "Remover dos favoritos" : "Salvar nos favoritos"}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    </button>
  );
}
