import { useState } from "react";
import { API_URL } from "../lib/api";

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
  images: ProductImage[];
  companyId?: { _id: string; name: string; slug: string } | string;
}

interface ProductCardProps {
  product: ProductCardProduct;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

function resolveUrl(url: string): string {
  return url.startsWith("/uploads") ? `${API_URL}${url}` : url;
}

export function ProductCard({ product, isAdmin, onEdit, onDelete }: ProductCardProps) {
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
    <article className="product-card">
      <div className="product-carousel">
        <img
          key={src}
          src={src}
          alt={product.name}
          className="product-image product-image--slide"
        />

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

      <div className="product-body">
        <div className="product-meta">
          <span className="pill">{product.category}</span>
          <strong>R$ {product.price.toFixed(2)}</strong>
        </div>
        <h3>{product.name}</h3>
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
