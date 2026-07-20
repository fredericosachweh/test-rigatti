import { useState } from "react";
import { API_URL } from "../lib/api";
import { FavoriteButton } from "./FavoriteButton";

export interface ProductImage {
  imageUrl: string;
  thumbnailUrl?: string;
}

export interface ProductCardProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  engineCc?: number;
  color?: string;
  images: ProductImage[];
  companyId?: { _id: string; name: string; slug: string } | string;
}

const numberFormat = new Intl.NumberFormat("pt-BR");

interface ProductCardProps {
  product: ProductCardProduct;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onOpen?: () => void;
}

function resolveUrl(url: string): string {
  return url.startsWith("/uploads") ? `${API_URL}${url}` : url;
}

export function ProductCard({ product, isAdmin, onEdit, onDelete, onOpen }: ProductCardProps) {
  const [index, setIndex] = useState(0);
  const images = product.images ?? [];
  const total = images.length;

  const current = images[index];
  const src = resolveUrl(current?.thumbnailUrl ?? current?.imageUrl ?? "");

  function prev(e: React.MouseEvent) {
    e.stopPropagation();
    setIndex((i) => (i - 1 + total) % total);
  }

  function next(e: React.MouseEvent) {
    e.stopPropagation();
    setIndex((i) => (i + 1) % total);
  }

  return (
    <article className={`product-card${onOpen ? " product-card--clickable" : ""}`}>
      <div
        className="product-carousel"
        onClick={onOpen}
        role={onOpen ? "button" : undefined}
        tabIndex={onOpen ? 0 : undefined}
        onKeyDown={
          onOpen
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpen();
                }
              }
            : undefined
        }
        aria-label={onOpen ? `Ver detalhes de ${product.name}` : undefined}
      >
        <img
          key={src}
          src={src}
          alt={product.name}
          className="product-image product-image--slide"
        />

        <FavoriteButton productId={product._id} className="favorite-button--card" />

        {total > 1 && (
          <>
            <button
              className="carousel-btn carousel-btn--prev"
              onClick={prev}
              type="button"
              aria-label="Anterior"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              className="carousel-btn carousel-btn--next"
              onClick={next}
              type="button"
              aria-label="Próxima"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <div className="carousel-dots">
              {images.map((_, i) => (
                <button
                  key={i}
                  className={`carousel-dot ${i === index ? "carousel-dot--active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex(i);
                  }}
                  type="button"
                  aria-label={`Imagem ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="product-body" onClick={onOpen}>
        <div className="product-meta">
          <span className="pill">{product.category}</span>
          <strong>R$ {numberFormat.format(product.price)}</strong>
        </div>
        <h3>{product.name}</h3>
        {(product.year || product.mileage != null || product.engineCc || product.color) && (
          <ul className="product-specs">
            {product.year ? <li>{product.year}</li> : null}
            {product.mileage != null ? <li>{numberFormat.format(product.mileage)} km</li> : null}
            {product.engineCc ? <li>{product.engineCc} cc</li> : null}
            {product.color ? <li>{product.color}</li> : null}
          </ul>
        )}
        <p>{product.description}</p>
        {typeof product.companyId === "object" && product.companyId && (
          <span className="product-company">{product.companyId.name}</span>
        )}
      </div>

      {isAdmin && (
        <div className="product-actions">
          <button className="ghost-button" onClick={onEdit} type="button">
            Editar
          </button>
          <button className="danger-button" onClick={onDelete} type="button">
            Excluir
          </button>
        </div>
      )}
    </article>
  );
}
