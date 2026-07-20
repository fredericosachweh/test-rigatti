import { useCatalogFilters } from "../contexts/CatalogFilterContext";

/**
 * Filtros de catálogo renderizados dentro do sidebar preto (marca, modelo,
 * categoria, ano e preço). A busca e o filtro por unidade continuam no topo.
 */
export function SidebarFilters() {
  const { filters, patch, brands, categories, resultCount, activeSidebarCount } =
    useCatalogFilters();

  function clearSidebar() {
    patch({ brand: "", model: "", category: "", yearFrom: "", yearTo: "", priceMax: "" });
  }

  return (
    <div className="sidebar-filters">
      <div className="sidebar-filters-header">
        <span className="field-label">Filtros</span>
        {activeSidebarCount > 0 && (
          <button type="button" className="sidebar-filters-clear" onClick={clearSidebar}>
            Limpar ({activeSidebarCount})
          </button>
        )}
      </div>

      <label className="field">
        <span>Marca</span>
        <select value={filters.brand} onChange={(e) => patch({ brand: e.target.value })}>
          <option value="">Todas</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Modelo</span>
        <input
          placeholder="Ex.: GS, Monster..."
          value={filters.model}
          onChange={(e) => patch({ model: e.target.value })}
        />
      </label>

      <label className="field">
        <span>Categoria / Tipo</span>
        <select value={filters.category} onChange={(e) => patch({ category: e.target.value })}>
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <div className="field-row">
        <label className="field">
          <span>Ano de</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="2015"
            min="1950"
            max="2100"
            value={filters.yearFrom}
            onChange={(e) => patch({ yearFrom: e.target.value })}
          />
        </label>
        <label className="field">
          <span>Ano até</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="2024"
            min="1950"
            max="2100"
            value={filters.yearTo}
            onChange={(e) => patch({ yearTo: e.target.value })}
          />
        </label>
      </div>

      <label className="field">
        <span>Preço até (R$)</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder="90000"
          min="0"
          value={filters.priceMax}
          onChange={(e) => patch({ priceMax: e.target.value })}
        />
      </label>

      <div className="sidebar-filters-count">{resultCount} moto(s)</div>
    </div>
  );
}
