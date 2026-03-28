import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { connect, disconnect } from "../../helpers/db.js";
import { createCompany, createProduct } from "../../helpers/factories.js";
import { searchProductsByCompany } from "../../../services/productSearch.js";

describe("searchProductsByCompany", () => {
  let companyId: string;

  beforeAll(async () => {
    await connect();
    const company = await createCompany({ slug: "search-co" });
    const other = await createCompany({ name: "Other Co", slug: "other-co" });
    companyId = company._id.toString();

    await createProduct(company._id, { name: "Botox Facial", category: "Facial", price: 500 });
    await createProduct(company._id, { name: "Peeling Químico", category: "Facial", price: 300 });
    await createProduct(company._id, { name: "Criolipólise", category: "Corporal", price: 800 });
    await createProduct(other._id, { name: "Hidden Product", category: "Facial", price: 100 });
  });

  afterAll(disconnect);

  it("returns only products belonging to the company", async () => {
    const results = await searchProductsByCompany(companyId, {});
    expect(results).toHaveLength(3);
    results.forEach((p) => expect(p.id).toBeDefined());
  });

  it("does not return products from another company", async () => {
    const results = await searchProductsByCompany(companyId, {});
    const names = results.map((p) => p.name);
    expect(names).not.toContain("Hidden Product");
  });

  it("filters by search term (name match)", async () => {
    const results = await searchProductsByCompany(companyId, { search: "botox" });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Botox Facial");
  });

  it("filters by category", async () => {
    const results = await searchProductsByCompany(companyId, { category: "Corporal" });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Criolipólise");
  });

  it("filters by maxPrice", async () => {
    const results = await searchProductsByCompany(companyId, { maxPrice: 400 });
    expect(results.every((p) => p.price <= 400)).toBe(true);
  });

  it("filters by minPrice", async () => {
    const results = await searchProductsByCompany(companyId, { minPrice: 600 });
    expect(results.every((p) => p.price >= 600)).toBe(true);
  });

  it("respects the limit parameter", async () => {
    const results = await searchProductsByCompany(companyId, { limit: 2 });
    expect(results).toHaveLength(2);
  });

  it("caps limit at 12", async () => {
    const results = await searchProductsByCompany(companyId, { limit: 99 });
    expect(results.length).toBeLessThanOrEqual(12);
  });

  it("returns an empty array when no match", async () => {
    const results = await searchProductsByCompany(companyId, { search: "nonexistent-xyz" });
    expect(results).toHaveLength(0);
  });

  it("includes required fields in each result", async () => {
    const [product] = await searchProductsByCompany(companyId, { limit: 1 });
    expect(product).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      description: expect.any(String),
      category: expect.any(String),
      price: expect.any(Number),
      imageUrl: expect.any(String)
    });
  });
});
