import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";

export interface CatalogFilterState {
  search: string;
  brand: string;
  model: string;
  category: string;
  yearFrom: string;
  yearTo: string;
  priceMax: string;
}

export const EMPTY_FILTERS: CatalogFilterState = {
  search: "",
  brand: "",
  model: "",
  category: "",
  yearFrom: "",
  yearTo: "",
  priceMax: ""
};

interface CatalogFilterContextValue {
  filters: CatalogFilterState;
  patch: (patch: Partial<CatalogFilterState>) => void;
  clearAll: () => void;
  selectedSlugs: string[];
  toggleSlug: (slug: string) => void;
  setSelectedSlugs: (slugs: string[]) => void;
  brands: string[];
  categories: string[];
  setFacets: (facets: { brands: string[]; categories: string[] }) => void;
  resultCount: number;
  setResultCount: (n: number) => void;
  /** nº de filtros do sidebar ativos (marca, modelo, ano, preço, categoria) */
  activeSidebarCount: number;
}

const CatalogFilterContext = createContext<CatalogFilterContextValue | undefined>(undefined);

export function CatalogFilterProvider({ children }: PropsWithChildren) {
  const [filters, setFilters] = useState<CatalogFilterState>(EMPTY_FILTERS);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [resultCount, setResultCount] = useState(0);

  const patch = useCallback((p: Partial<CatalogFilterState>) => {
    setFilters((prev) => ({ ...prev, ...p }));
  }, []);

  const clearAll = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setSelectedSlugs([]);
  }, []);

  const toggleSlug = useCallback((slug: string) => {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  const setFacets = useCallback((facets: { brands: string[]; categories: string[] }) => {
    setBrands((prev) => (prev.join("|") === facets.brands.join("|") ? prev : facets.brands));
    setCategories((prev) =>
      prev.join("|") === facets.categories.join("|") ? prev : facets.categories
    );
  }, []);

  const activeSidebarCount = useMemo(
    () =>
      [
        filters.brand,
        filters.model,
        filters.category,
        filters.yearFrom,
        filters.yearTo,
        filters.priceMax
      ].filter((v) => v.trim() !== "").length,
    [filters]
  );

  const value: CatalogFilterContextValue = {
    filters,
    patch,
    clearAll,
    selectedSlugs,
    toggleSlug,
    setSelectedSlugs,
    brands,
    categories,
    setFacets,
    resultCount,
    setResultCount,
    activeSidebarCount
  };

  return <CatalogFilterContext.Provider value={value}>{children}</CatalogFilterContext.Provider>;
}

export function useCatalogFilters() {
  const ctx = useContext(CatalogFilterContext);
  if (!ctx) {
    throw new Error("useCatalogFilters must be used within CatalogFilterProvider");
  }
  return ctx;
}
