import { useEffect, useState } from "react";
import { ProductCard, type ProductCardProduct } from "../components/ProductCard";
import { ProductForm, type ProductInput } from "../components/ProductForm";
import { useAuth } from "../contexts/AuthContext";
import { ApiError, apiFetch } from "../lib/api";

interface Company {
  _id: string;
  name: string;
  slug: string;
}

export function DashboardPage() {
  const { token, user } = useAuth();
  const [products, setProducts] = useState<ProductCardProduct[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [editingProduct, setEditingProduct] = useState<ProductCardProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token || user?.role !== "cliente") return;
    apiFetch<{ companies: Company[] }>("/companies", { token })
      .then((r) => setCompanies(r.companies))
      .catch(() => {});
  }, [token, user?.role]);

  async function loadProducts() {
    if (!token) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      selectedSlugs.forEach((s) => params.append("companySlugs[]", s));
      const response = await apiFetch<{ products: ProductCardProduct[] }>(
        `/products${params.toString() ? `?${params.toString()}` : ""}`,
        { token }
      );
      setFeedback("");
      setProducts(response.products);
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.message : "Falha ao carregar produtos.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, [token, search, selectedSlugs]);

  function toggleSlug(slug: string) {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  const categories = Array.from(new Set(products.map((p) => p.category))).sort();

  async function handleCreate(payload: ProductInput) {
    if (!token) return;
    await apiFetch("/products", {
      method: "POST",
      token,
      body: { ...payload, price: Number(payload.price) }
    });
    setFeedback("Tratamento criado com sucesso.");
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
    setFeedback("Tratamento atualizado com sucesso.");
    setEditingProduct(null);
    await loadProducts();
  }

  async function handleDelete(id: string) {
    if (!token) return;
    if (!window.confirm("Deseja remover este tratamento?")) return;
    await apiFetch(`/products/${id}`, { method: "DELETE", token });
    setFeedback("Tratamento removido.");
    await loadProducts();
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Clínica Rigatti</p>
          <h2>Catálogo de tratamentos</h2>
          <p className="muted">
            {user?.role === "admin"
              ? "Gerencie os procedimentos e tratamentos disponíveis na clínica."
              : "Visualize o catálogo. Use o chat para indicar tratamentos a pacientes."}
          </p>
        </div>
        <div className="stats-bar">
          <div className="stat-card">
            <span>Tratamentos</span>
            <strong>{products.length}</strong>
          </div>
          <div className="stat-card">
            <span>Especialidades</span>
            <strong>{categories.length}</strong>
          </div>
        </div>
      </header>

      <div className="toolbar panel">
        <label className="field">
          <span>Buscar no catálogo</span>
          <input
            placeholder="Procedimento, especialidade ou descrição"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        {user?.role === "cliente" && companies.length > 0 && (
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
                  onClick={() => setSelectedSlugs([])}
                >
                  Limpar filtro
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {feedback ? <div className="success-banner">{feedback}</div> : null}

      {user?.role === "admin" ? (
        <section className="dashboard-grid">
          <ProductForm
            initialValue={
              editingProduct
                ? {
                    name: editingProduct.name,
                    description: editingProduct.description,
                    price: String(editingProduct.price),
                    category: editingProduct.category,
                    images: editingProduct.images
                  }
                : undefined
            }
            onCancel={editingProduct ? () => setEditingProduct(null) : undefined}
            onSubmit={editingProduct ? handleUpdate : handleCreate}
            submitLabel={editingProduct ? "Salvar alterações" : "Adicionar tratamento"}
          />
          <section className="catalog-grid">
            {isLoading ? <div className="panel">Carregando catálogo...</div> : null}
            {!isLoading && products.length === 0 ? (
              <div className="panel">Nenhum tratamento encontrado.</div>
            ) : null}
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                isAdmin
                onEdit={() => setEditingProduct(product)}
                onDelete={() => void handleDelete(product._id)}
              />
            ))}
          </section>
        </section>
      ) : (
        <section className="catalog-grid solo">
          {isLoading ? <div className="panel">Carregando catálogo...</div> : null}
          {!isLoading && products.length === 0 ? (
            <div className="panel">Nenhum tratamento encontrado.</div>
          ) : null}
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </section>
      )}
    </div>
  );
}
