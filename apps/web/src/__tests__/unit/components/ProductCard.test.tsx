import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";
import { ProductCard, type ProductCardProduct } from "../../../components/ProductCard";
import { AuthProvider } from "../../../contexts/AuthContext";
import { FavoritesProvider } from "../../../contexts/FavoritesContext";

// ProductCard usa FavoriteButton (favoritos + navegação), então precisa dos providers.
function renderCard(ui: ReactElement) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <FavoritesProvider>{ui}</FavoritesProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

function makeProduct(overrides: Partial<ProductCardProduct> = {}): ProductCardProduct {
  return {
    _id: "prod-1",
    name: "BMW R 1250 GS 2021",
    description: "Trail premium com pacote completo e revisões em dia.",
    price: 89900,
    category: "Big Trail",
    brand: "BMW",
    model: "R 1250 GS",
    year: 2021,
    mileage: 32000,
    engineCc: 1254,
    color: "Cinza",
    images: [
      { imageUrl: "http://example.com/img1.webp", thumbnailUrl: "http://example.com/thumb1.webp" }
    ],
    ...overrides
  };
}

describe("ProductCard — rendering", () => {
  it("renders product name", () => {
    renderCard(<ProductCard product={makeProduct()} />);
    expect(screen.getByText("BMW R 1250 GS 2021")).toBeInTheDocument();
  });

  it("renders product description", () => {
    renderCard(<ProductCard product={makeProduct()} />);
    expect(screen.getByText(/Trail premium/)).toBeInTheDocument();
  });

  it("renders formatted price", () => {
    renderCard(<ProductCard product={makeProduct()} />);
    expect(screen.getByText(/89.900/)).toBeInTheDocument();
  });

  it("renders category pill", () => {
    renderCard(<ProductCard product={makeProduct()} />);
    expect(screen.getByText("Big Trail")).toBeInTheDocument();
  });

  it("does not render edit/delete buttons when isAdmin is false", () => {
    renderCard(<ProductCard product={makeProduct()} />);
    expect(screen.queryByText("Editar")).not.toBeInTheDocument();
    expect(screen.queryByText("Excluir")).not.toBeInTheDocument();
  });

  it("renders edit and delete buttons when isAdmin is true", () => {
    renderCard(
      <ProductCard product={makeProduct()} isAdmin onEdit={() => {}} onDelete={() => {}} />
    );
    expect(screen.getByText("Editar")).toBeInTheDocument();
    expect(screen.getByText("Excluir")).toBeInTheDocument();
  });

  it("renders company name when companyId is populated object", () => {
    const product = makeProduct({
      companyId: { _id: "co-1", name: "Modena SPO — Curitiba", slug: "modena-curitiba" }
    });
    renderCard(<ProductCard product={product} />);
    expect(screen.getByText("Modena SPO — Curitiba")).toBeInTheDocument();
  });

  it("does not crash when companyId is a string (not populated)", () => {
    const product = makeProduct({ companyId: "co-id-string" });
    renderCard(<ProductCard product={product} />);
    expect(screen.getByText("BMW R 1250 GS 2021")).toBeInTheDocument();
  });
});

describe("ProductCard — carousel", () => {
  const multiProduct = makeProduct({
    images: [
      { imageUrl: "http://example.com/img1.webp", thumbnailUrl: "http://example.com/thumb1.webp" },
      { imageUrl: "http://example.com/img2.webp", thumbnailUrl: "http://example.com/thumb2.webp" },
      { imageUrl: "http://example.com/img3.webp", thumbnailUrl: "http://example.com/thumb3.webp" }
    ]
  });

  it("does not render carousel controls for a single image", () => {
    renderCard(<ProductCard product={makeProduct()} />);
    expect(screen.queryByLabelText("Próxima")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Anterior")).not.toBeInTheDocument();
  });

  it("renders prev/next buttons for multiple images", () => {
    renderCard(<ProductCard product={multiProduct} />);
    expect(screen.getByLabelText("Anterior")).toBeInTheDocument();
    expect(screen.getByLabelText("Próxima")).toBeInTheDocument();
  });

  it("renders one dot per image", () => {
    renderCard(<ProductCard product={multiProduct} />);
    const dots = screen.getAllByLabelText(/Imagem \d/);
    expect(dots).toHaveLength(3);
  });

  it("advances to next image on next button click", () => {
    renderCard(<ProductCard product={multiProduct} />);
    const initialSrc = (screen.getByAltText("BMW R 1250 GS 2021") as HTMLImageElement).src;

    fireEvent.click(screen.getByLabelText("Próxima"));

    // Re-query after key change causes remount
    const nextSrc = (screen.getByAltText("BMW R 1250 GS 2021") as HTMLImageElement).src;
    expect(nextSrc).not.toBe(initialSrc);
  });

  it("cycles back to first image after last", () => {
    renderCard(<ProductCard product={multiProduct} />);
    const firstSrc = (screen.getByAltText("BMW R 1250 GS 2021") as HTMLImageElement).src;

    fireEvent.click(screen.getByLabelText("Próxima"));
    fireEvent.click(screen.getByLabelText("Próxima"));
    fireEvent.click(screen.getByLabelText("Próxima")); // back to first

    const finalSrc = (screen.getByAltText("BMW R 1250 GS 2021") as HTMLImageElement).src;
    expect(finalSrc).toBe(firstSrc);
  });

  it("goes to previous image on prev button click", () => {
    renderCard(<ProductCard product={multiProduct} />);

    fireEvent.click(screen.getByLabelText("Próxima")); // go to img2
    const img2Src = (screen.getByAltText("BMW R 1250 GS 2021") as HTMLImageElement).src;

    fireEvent.click(screen.getByLabelText("Anterior")); // back to img1
    const backSrc = (screen.getByAltText("BMW R 1250 GS 2021") as HTMLImageElement).src;

    expect(backSrc).not.toBe(img2Src);
  });
});
