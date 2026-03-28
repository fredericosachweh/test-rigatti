import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductCard, type ProductCardProduct } from "../../../components/ProductCard";

function makeProduct(overrides: Partial<ProductCardProduct> = {}): ProductCardProduct {
  return {
    _id: "prod-1",
    name: "Botox Facial",
    description: "Suaviza rugas de expressão com resultado natural.",
    price: 1200,
    category: "Facial",
    images: [
      { imageUrl: "http://example.com/img1.webp", thumbnailUrl: "http://example.com/thumb1.webp" }
    ],
    ...overrides
  };
}

describe("ProductCard — rendering", () => {
  it("renders product name", () => {
    render(<ProductCard product={makeProduct()} />);
    expect(screen.getByText("Botox Facial")).toBeInTheDocument();
  });

  it("renders product description", () => {
    render(<ProductCard product={makeProduct()} />);
    expect(screen.getByText(/Suaviza rugas/)).toBeInTheDocument();
  });

  it("renders formatted price", () => {
    render(<ProductCard product={makeProduct()} />);
    expect(screen.getByText(/1200/)).toBeInTheDocument();
  });

  it("renders category pill", () => {
    render(<ProductCard product={makeProduct()} />);
    expect(screen.getByText("Facial")).toBeInTheDocument();
  });

  it("does not render edit/delete buttons when isAdmin is false", () => {
    render(<ProductCard product={makeProduct()} />);
    expect(screen.queryByText("Editar")).not.toBeInTheDocument();
    expect(screen.queryByText("Excluir")).not.toBeInTheDocument();
  });

  it("renders edit and delete buttons when isAdmin is true", () => {
    render(<ProductCard product={makeProduct()} isAdmin onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("Editar")).toBeInTheDocument();
    expect(screen.getByText("Excluir")).toBeInTheDocument();
  });

  it("renders company name when companyId is populated object", () => {
    const product = makeProduct({
      companyId: { _id: "co-1", name: "Clínica Rigatti — Curitiba", slug: "rigatti-curitiba" }
    });
    render(<ProductCard product={product} />);
    expect(screen.getByText("Clínica Rigatti — Curitiba")).toBeInTheDocument();
  });

  it("does not crash when companyId is a string (not populated)", () => {
    const product = makeProduct({ companyId: "co-id-string" });
    render(<ProductCard product={product} />);
    expect(screen.getByText("Botox Facial")).toBeInTheDocument();
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
    render(<ProductCard product={makeProduct()} />);
    expect(screen.queryByLabelText("Próxima")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Anterior")).not.toBeInTheDocument();
  });

  it("renders prev/next buttons for multiple images", () => {
    render(<ProductCard product={multiProduct} />);
    expect(screen.getByLabelText("Anterior")).toBeInTheDocument();
    expect(screen.getByLabelText("Próxima")).toBeInTheDocument();
  });

  it("renders one dot per image", () => {
    render(<ProductCard product={multiProduct} />);
    const dots = screen.getAllByLabelText(/Imagem \d/);
    expect(dots).toHaveLength(3);
  });

  it("advances to next image on next button click", () => {
    render(<ProductCard product={multiProduct} />);
    const initialSrc = (screen.getByAltText("Botox Facial") as HTMLImageElement).src;

    fireEvent.click(screen.getByLabelText("Próxima"));

    // Re-query after key change causes remount
    const nextSrc = (screen.getByAltText("Botox Facial") as HTMLImageElement).src;
    expect(nextSrc).not.toBe(initialSrc);
  });

  it("cycles back to first image after last", () => {
    render(<ProductCard product={multiProduct} />);
    const firstSrc = (screen.getByAltText("Botox Facial") as HTMLImageElement).src;

    fireEvent.click(screen.getByLabelText("Próxima"));
    fireEvent.click(screen.getByLabelText("Próxima"));
    fireEvent.click(screen.getByLabelText("Próxima")); // back to first

    const finalSrc = (screen.getByAltText("Botox Facial") as HTMLImageElement).src;
    expect(finalSrc).toBe(firstSrc);
  });

  it("goes to previous image on prev button click", () => {
    render(<ProductCard product={multiProduct} />);

    fireEvent.click(screen.getByLabelText("Próxima")); // go to img2
    const img2Src = (screen.getByAltText("Botox Facial") as HTMLImageElement).src;

    fireEvent.click(screen.getByLabelText("Anterior")); // back to img1
    const backSrc = (screen.getByAltText("Botox Facial") as HTMLImageElement).src;

    expect(backSrc).not.toBe(img2Src);
  });
});
