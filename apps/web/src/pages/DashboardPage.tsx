import { useEffect, useMemo, useRef, useState } from "react";
import { ProductCard, type ProductCardProduct } from "../components/ProductCard";
import { ProductForm, type ProductInput } from "../components/ProductForm";
import { ProductModal } from "../components/ProductModal";
import { useAuth } from "../contexts/AuthContext";
import { useCatalogFilters } from "../contexts/CatalogFilterContext";
import { ApiError, apiFetch } from "../lib/api";

interface Company {
  _id: string;
  name: string;
  slug: string;
}

const PAGE_SIZE = 12;

export function DashboardPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { filters, patch, selectedSlugs, toggleSlug, setFacets, setResultCount } =
    useCatalogFilters();

  const [products, setProducts] = useState<ProductCardProduct[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [editingProduct, setEditingProduct] = useState<ProductCardProduct | null>(null);
  const [viewingProduct, setViewingProduct] = useState<ProductCardProduct | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Catálogo público: visitantes anônimos e clientes veem o filtro por unidade
    if (isAdmin) return;
    apiFetch<{ companies: Company[] }>("/companies", { token })
      .then((r) => setCompanies(r.companies))
      .catch(() => {});
  }, [token, isAdmin]);

  async function loadProducts() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      selectedSlugs.forEach((s) => params.append("companySlugs[]", s));
      const response = await apiFetch<{ products: ProductCardProduct[] }>(
        `/products${params.toString() ? `?${params.toString()}` : ""}`,
        { token }
      );
      setFeedback("");
      setProducts(response.products);
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.message : "Falha ao carregar o estoque.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedSlugs]);

  // Predicado de filtro; `skip` ignora um filtro específico para o cálculo de facetas
  const makeMatcher = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    const yearFrom = filters.yearFrom ? Number(filters.yearFrom) : null;
    const yearTo = filters.yearTo ? Number(filters.yearTo) : null;
    const priceMax = filters.priceMax ? Number(filters.priceMax) : null;
    const model = filters.model.trim().toLowerCase();

    return (skip?: "brand" | "category") => (p: ProductCardProduct) => {
      if (term) {
        const haystack =
          `${p.name} ${p.brand ?? ""} ${p.model ?? ""} ${p.color ?? ""} ${p.category} ${p.description}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (skip !== "brand" && filters.brand && p.brand !== filters.brand) return false;
      if (model && !(p.model ?? "").toLowerCase().includes(model)) return false;
      if (skip !== "category" && filters.category && p.category !== filters.category) return false;
      if (yearFrom != null && (p.year ?? 0) < yearFrom) return false;
      if (yearTo != null && (p.year ?? 9999) > yearTo) return false;
      if (priceMax != null && p.price > priceMax) return false;
      return true;
    };
  }, [filters]);

  // Marca: lista SEMPRE completa (âncora para reiniciar os filtros)
  const brands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand).filter(Boolean) as string[])).sort(),
    [products]
  );

  // Categoria: opções refletem o resultado atual (exceto o próprio filtro de categoria)
  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .filter(makeMatcher("category"))
            .map((p) => p.category)
            .filter(Boolean)
        )
      ).sort(),
    [products, makeMatcher]
  );

  // Publica as opções de filtro para o sidebar (via contexto)
  useEffect(() => {
    setFacets({ brands, categories });
  }, [brands, categories, setFacets]);

  // Se a categoria selecionada sumir do resultado (ex.: trocou a marca), reinicia-a
  useEffect(() => {
    if (filters.category && !categories.includes(filters.category)) {
      patch({ category: "" });
    }
  }, [categories, filters.category, patch]);

  // Resultado final (todos os filtros aplicados)
  const filtered = useMemo(() => products.filter(makeMatcher()), [products, makeMatcher]);

  useEffect(() => {
    setResultCount(filtered.length);
  }, [filtered.length, setResultCount]);

  // Scroll infinito: reinicia para a 1ª página quando o recorte muda
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filtered]);

  const shown = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Carrega +12 quando o sentinela entra na viewport
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => c + PAGE_SIZE);
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, visibleCount]);

  async function handleCreate(payload: ProductInput) {
    if (!token) return;
    await apiFetch("/products", {
      method: "POST",
      token,
      body: { ...payload, price: Number(payload.price) }
    });
    setFeedback("Moto cadastrada com sucesso.");
    setEditingProduct(null);
    await loadProducts();
  }

  async function handleUpdate(payload: ProductInput) {
    if (!token || !editingProduct) return;
    await apiFetch(`/products/${editingProduct._id}`, {
      method: "PUT",
      token,
      body: { ...payload, price: Number(payload.price) }
    });
    setFeedback("Moto atualizada com sucesso.");
    setEditingProduct(null);
    await loadProducts();
  }

  async function handleDelete(id: string) {
    if (!token) return;
    if (!window.confirm("Deseja remover esta moto?")) return;
    await apiFetch(`/products/${id}`, { method: "DELETE", token });
    setFeedback("Moto removida.");
    await loadProducts();
  }

  const emptyMessage =
    products.length === 0 ? "Nenhuma moto no estoque." : "Nenhuma moto para os filtros aplicados.";

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Modena SPO</p>
          <h2>Estoque de motos</h2>
          <p className="muted">
            {isAdmin
              ? "Gerencie as motos disponíveis no estoque da loja."
              : "Explore o estoque e encontre a moto ideal."}
          </p>
        </div>
        <div className="stats-bar">
          <div className="stat-card">
            <span>Motos</span>
            <strong>{filtered.length}</strong>
          </div>
          <div className="stat-card">
            <span>Categorias</span>
            <strong>{categories.length}</strong>
          </div>
        </div>
      </header>

      {/* Filtros do topo: busca (todos) + unidade (não-admin com +1 unidade) */}
      <div className="toolbar panel">
        <label className="field">
          <span>Buscar no catálogo</span>
          <input
            placeholder="Marca, modelo, ano ou cor"
            value={filters.search}
            onChange={(e) => patch({ search: e.target.value })}
          />
        </label>
        {!isAdmin && companies.length > 1 && (
          <div
            className={`company-filter-accordion${filterOpen ? " company-filter-accordion--open" : ""}`}
          >
            <button
              type="button"
              className="company-filter-trigger"
              onClick={() => setFilterOpen((v) => !v)}
            >
              <span className="company-filter-trigger-label">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Filtrar por unidade
                {selectedSlugs.length > 0 && (
                  <span className="company-filter-badge">{selectedSlugs.length}</span>
                )}
              </span>
              <svg
                className="company-filter-chevron"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <div className="company-filter-body">
              {companies.map((c) => (
                <label key={c.slug} className="company-filter-option">
                  <input
                    type="checkbox"
                    checked={selectedSlugs.includes(c.slug)}
                    onChange={() => toggleSlug(c.slug)}
                  />
                  <span>{c.name}</span>
                </label>
              ))}
              {selectedSlugs.length > 0 && (
                <button
                  type="button"
                  className="company-filter-clear"
                  onClick={() => selectedSlugs.forEach((s) => toggleSlug(s))}
                >
                  Limpar filtro
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {feedback ? <div className="success-banner">{feedback}</div> : null}

      {isAdmin ? (
        <section className="dashboard-grid">
          <ProductForm
            initialValue={
              editingProduct
                ? {
                    name: editingProduct.name,
                    description: editingProduct.description,
                    price: String(editingProduct.price),
                    category: editingProduct.category,
                    brand: editingProduct.brand ?? "",
                    model: editingProduct.model ?? "",
                    year: editingProduct.year != null ? String(editingProduct.year) : "",
                    mileage: editingProduct.mileage != null ? String(editingProduct.mileage) : "",
                    engineCc:
                      editingProduct.engineCc != null ? String(editingProduct.engineCc) : "",
                    color: editingProduct.color ?? "",
                    images: editingProduct.images
                  }
                : undefined
            }
            onCancel={editingProduct ? () => setEditingProduct(null) : undefined}
            onSubmit={editingProduct ? handleUpdate : handleCreate}
            submitLabel={editingProduct ? "Salvar alterações" : "Adicionar moto"}
          />
          <section className="catalog-grid">
            {isLoading ? <div className="panel">Carregando catálogo...</div> : null}
            {!isLoading && filtered.length === 0 ? (
              <div className="panel">{emptyMessage}</div>
            ) : null}
            {shown.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                isAdmin
                onOpen={() => setViewingProduct(product)}
                onEdit={() => setEditingProduct(product)}
                onDelete={() => void handleDelete(product._id)}
              />
            ))}
            {hasMore && (
              <div ref={sentinelRef} className="catalog-sentinel">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                >
                  Carregar mais
                </button>
              </div>
            )}
          </section>
        </section>
      ) : (
        <section className="catalog-grid solo">
          {isLoading ? <div className="panel">Carregando catálogo...</div> : null}
          {!isLoading && filtered.length === 0 ? <div className="panel">{emptyMessage}</div> : null}
          {shown.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onOpen={() => setViewingProduct(product)}
            />
          ))}
          {hasMore && (
            <div ref={sentinelRef} className="catalog-sentinel">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                Carregar mais
              </button>
            </div>
          )}
        </section>
      )}

      {viewingProduct && (
        <ProductModal product={viewingProduct} onClose={() => setViewingProduct(null)} />
      )}
    </div>
  );
}
