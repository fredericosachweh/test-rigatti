import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductCard, type ProductCardProduct } from "../components/ProductCard";
import { ProductModal } from "../components/ProductModal";
import { useAuth } from "../contexts/AuthContext";
import { useFavorites } from "../contexts/FavoritesContext";
import { ApiError, apiFetch } from "../lib/api";

export function FavoritesPage() {
  const { token } = useAuth();
  const { favoriteIds } = useFavorites();
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductCardProduct[]>([]);
  const [viewingProduct, setViewingProduct] = useState<ProductCardProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Recarrega quando o conjunto de favoritos muda (para trazer novos itens)
  const favKey = useMemo(() => Array.from(favoriteIds).sort().join(","), [favoriteIds]);

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    apiFetch<{ products: ProductCardProduct[] }>("/favorites", { token })
      .then((res) => {
        setProducts(res.products);
        setError("");
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Falha ao carregar favoritos."))
      .finally(() => setIsLoading(false));
  }, [token, favKey]);

  // Filtra em tempo real: ao desfavoritar, o item some imediatamente
  const visible = products.filter((p) => favoriteIds.has(p._id));

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Modena SPO</p>
          <h2>Meus favoritos</h2>
          <p className="muted">As motos que você salvou para acompanhar e negociar.</p>
        </div>
        <div className="stats-bar">
          <div className="stat-card">
            <span>Favoritas</span>
            <strong>{visible.length}</strong>
          </div>
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      {isLoading ? (
        <div className="panel">Carregando favoritos...</div>
      ) : visible.length === 0 ? (
        <div className="panel empty-favorites">
          <p>Você ainda não salvou nenhuma moto.</p>
          <button className="primary-button" type="button" onClick={() => navigate("/catalogo")}>
            Explorar o catálogo
          </button>
        </div>
      ) : (
        <section className="catalog-grid solo">
          {visible.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onOpen={() => setViewingProduct(product)}
            />
          ))}
        </section>
      )}

      {viewingProduct && (
        <ProductModal product={viewingProduct} onClose={() => setViewingProduct(null)} />
      )}
    </div>
  );
}
