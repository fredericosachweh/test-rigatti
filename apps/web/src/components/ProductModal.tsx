import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { API_URL } from "../lib/api";
import { FavoriteButton } from "./FavoriteButton";
import type { ProductCardProduct } from "./ProductCard";

interface ProductModalProps {
  product: ProductCardProduct;
  onClose: () => void;
}

const numberFormat = new Intl.NumberFormat("pt-BR");
const WHATSAPP_NUMBER = "5541999755741";

function resolveUrl(url: string): string {
  return url.startsWith("/uploads") ? `${API_URL}${url}` : url;
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const images = product.images ?? [];
  const total = images.length;
  const current = images[index];
  const src = resolveUrl(current?.imageUrl ?? current?.thumbnailUrl ?? "");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + total) % total);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % total);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [total, onClose]);

  function prev() {
    setIndex((i) => (i - 1 + total) % total);
  }

  function next() {
    setIndex((i) => (i + 1) % total);
  }

  const specs: Array<{ label: string; value: string }> = [];
  if (product.brand) specs.push({ label: "Marca", value: product.brand });
  if (product.model) specs.push({ label: "Modelo", value: product.model });
  if (product.year) specs.push({ label: "Ano", value: String(product.year) });
  if (product.mileage != null)
    specs.push({ label: "Quilometragem", value: `${numberFormat.format(product.mileage)} km` });
  if (product.engineCc) specs.push({ label: "Cilindrada", value: `${product.engineCc} cc` });
  if (product.color) specs.push({ label: "Cor", value: product.color });
  specs.push({ label: "Categoria", value: product.category });

  const companyName =
    typeof product.companyId === "object" && product.companyId ? product.companyId.name : null;

  // Mensagem do WhatsApp já preenchida com os dados do usuário logado (autofill)
  const greeting = user ? `Olá, aqui é ${user.name} (${user.email}).` : "Olá!";
  const whatsappMessage =
    `${greeting} Tenho interesse na ${product.name}` +
    (product.year ? ` ${product.year}` : "") +
    ` anunciada por R$ ${numberFormat.format(product.price)}. Podemos falar?`;
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="product-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="product-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
      >
        <button className="product-modal-close" onClick={onClose} type="button" aria-label="Fechar">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="product-modal-gallery">
          <img key={src} src={src} alt={product.name} className="product-modal-image" />

          {total > 1 && (
            <>
              <button
                className="carousel-btn carousel-btn--prev"
                onClick={prev}
                type="button"
                aria-label="Anterior"
              >
                <svg
                  width="18"
                  height="18"
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
                  width="18"
                  height="18"
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
              <span className="product-modal-counter">
                {index + 1} / {total}
              </span>
            </>
          )}
        </div>

        {total > 1 && (
          <div className="product-modal-thumbs">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                className={`product-modal-thumb ${i === index ? "product-modal-thumb--active" : ""}`}
                onClick={() => setIndex(i)}
                aria-label={`Imagem ${i + 1}`}
              >
                <img
                  src={resolveUrl(img.thumbnailUrl ?? img.imageUrl)}
                  alt={`Miniatura ${i + 1}`}
                />
              </button>
            ))}
          </div>
        )}

        <div className="product-modal-body">
          <div className="product-modal-header">
            <div>
              <span className="pill">{product.category}</span>
              <h2>{product.name}</h2>
              {companyName && <span className="product-company">{companyName}</span>}
            </div>
            <div className="product-modal-price-col">
              <strong className="product-modal-price">
                R$ {numberFormat.format(product.price)}
              </strong>
              <FavoriteButton
                productId={product._id}
                className="favorite-button--modal"
                size={20}
              />
            </div>
          </div>

          <dl className="product-modal-specs">
            {specs.map((spec) => (
              <div key={spec.label} className="product-modal-spec">
                <dt>{spec.label}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>

          <div className="product-modal-description">
            <h3>Descrição</h3>
            <p>{product.description}</p>
          </div>

          <a
            className="primary-button product-modal-cta"
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
          >
            Falar com a loja no WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
