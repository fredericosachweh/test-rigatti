import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { connect, disconnect, clearCollections } from "../helpers/db.js";
import {
  createAdmin,
  createCliente,
  createCompany,
  createProduct,
  tokenFor
} from "../helpers/factories.js";

const validProduct = {
  name: "Botox Facial",
  description: "Aplicação de toxina botulínica para suavizar rugas.",
  price: 1200,
  category: "Facial",
  images: [{ imageUrl: "/uploads/products/original/botox.webp" }]
};

describe("GET /products", () => {
  beforeAll(connect);
  afterAll(disconnect);
  beforeEach(clearCollections);

  it("admin sees only their company products", async () => {
    const co1 = await createCompany({ slug: "co1" });
    const co2 = await createCompany({ name: "Co2", slug: "co2" });
    const admin = await createAdmin(co1._id);
    await createProduct(co1._id, { name: "Product A" });
    await createProduct(co2._id, { name: "Product B" });

    const res = await request(app)
      .get("/products")
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toBe("Product A");
  });

  it("cliente sees all companies products", async () => {
    const co1 = await createCompany({ slug: "co1" });
    const co2 = await createCompany({ name: "Co2", slug: "co2" });
    const cliente = await createCliente();
    await createProduct(co1._id, { name: "Product A" });
    await createProduct(co2._id, { name: "Product B" });

    const res = await request(app)
      .get("/products")
      .set("Authorization", `Bearer ${tokenFor(cliente)}`);

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(2);
  });

  it("cliente filters by companySlug", async () => {
    const co1 = await createCompany({ slug: "filter-co1" });
    const co2 = await createCompany({ name: "Co2", slug: "filter-co2" });
    const cliente = await createCliente({ email: "c2@test.com" });
    await createProduct(co1._id, { name: "Product A" });
    await createProduct(co2._id, { name: "Product B" });

    const res = await request(app)
      .get("/products?companySlugs[]=filter-co1")
      .set("Authorization", `Bearer ${tokenFor(cliente)}`);

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toBe("Product A");
  });

  it("filters by search term", async () => {
    const co = await createCompany({ slug: "search-co" });
    const admin = await createAdmin(co._id);
    await createProduct(co._id, { name: "Botox Facial" });
    await createProduct(co._id, {
      name: "Peeling Médio",
      description: "esfoliação química profunda"
    });

    const res = await request(app)
      .get("/products?search=botox")
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
  });

  it("returns 401 without token", async () => {
    const res = await request(app).get("/products");
    expect(res.status).toBe(401);
  });
});

describe("POST /products", () => {
  beforeAll(connect);
  afterAll(disconnect);
  beforeEach(clearCollections);

  it("admin creates a product successfully", async () => {
    const co = await createCompany({ slug: "create-co" });
    const admin = await createAdmin(co._id);

    const res = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send(validProduct);

    expect(res.status).toBe(201);
    expect(res.body.product.name).toBe(validProduct.name);
    expect(res.body.product.companyId).toBe(co._id.toString());
  });

  it("cliente cannot create a product (403)", async () => {
    const cliente = await createCliente();

    const res = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${tokenFor(cliente)}`)
      .send(validProduct);

    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid payload", async () => {
    const co = await createCompany({ slug: "bad-create-co" });
    const admin = await createAdmin(co._id);

    const res = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({ name: "x" }); // too short + missing fields

    expect(res.status).toBe(400);
  });
});

describe("PUT /products/:id", () => {
  beforeAll(connect);
  afterAll(disconnect);
  beforeEach(clearCollections);

  it("admin updates own product", async () => {
    const co = await createCompany({ slug: "upd-co" });
    const admin = await createAdmin(co._id);
    const product = await createProduct(co._id);

    const res = await request(app)
      .put(`/products/${product._id}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({ ...validProduct, name: "Updated Name" });

    expect(res.status).toBe(200);
    expect(res.body.product.name).toBe("Updated Name");
  });

  it("admin cannot update another company's product (404)", async () => {
    const co1 = await createCompany({ slug: "own-co" });
    const co2 = await createCompany({ name: "Other", slug: "other-co" });
    const admin = await createAdmin(co1._id);
    const product = await createProduct(co2._id);

    const res = await request(app)
      .put(`/products/${product._id}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send(validProduct);

    expect(res.status).toBe(404);
  });
});

describe("DELETE /products/:id", () => {
  beforeAll(connect);
  afterAll(disconnect);
  beforeEach(clearCollections);

  it("admin deletes own product (204)", async () => {
    const co = await createCompany({ slug: "del-co" });
    const admin = await createAdmin(co._id);
    const product = await createProduct(co._id);

    const res = await request(app)
      .delete(`/products/${product._id}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(204);
  });

  it("admin cannot delete another company's product (404)", async () => {
    const co1 = await createCompany({ slug: "delown-co" });
    const co2 = await createCompany({ name: "Alien", slug: "alien-co" });
    const admin = await createAdmin(co1._id);
    const product = await createProduct(co2._id);

    const res = await request(app)
      .delete(`/products/${product._id}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(404);
  });

  it("returns 401 without token", async () => {
    const co = await createCompany({ slug: "noauth-del-co" });
    const product = await createProduct(co._id);

    const res = await request(app).delete(`/products/${product._id}`);
    expect(res.status).toBe(401);
  });
});

describe("GET /products/:id", () => {
  beforeAll(connect);
  afterAll(disconnect);
  beforeEach(clearCollections);

  it("admin fetches own product by id", async () => {
    const co = await createCompany({ slug: "get-co" });
    const admin = await createAdmin(co._id);
    const product = await createProduct(co._id, { name: "Meu Produto" });

    const res = await request(app)
      .get(`/products/${product._id}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(200);
    expect(res.body.product.name).toBe("Meu Produto");
    expect(res.body.product._id).toBe(product._id.toString());
  });

  it("returns 404 for product from another company", async () => {
    const co1 = await createCompany({ slug: "get-co1" });
    const co2 = await createCompany({ name: "Other", slug: "get-co2" });
    const admin = await createAdmin(co1._id);
    const product = await createProduct(co2._id);

    const res = await request(app)
      .get(`/products/${product._id}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(404);
  });

  it("returns 404 for non-existent id", async () => {
    const co = await createCompany({ slug: "get-notfound-co" });
    const admin = await createAdmin(co._id);

    const res = await request(app)
      .get("/products/000000000000000000000000")
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(404);
  });

  it("returns 401 without token", async () => {
    const co = await createCompany({ slug: "get-noauth-co" });
    const product = await createProduct(co._id);

    const res = await request(app).get(`/products/${product._id}`);
    expect(res.status).toBe(401);
  });
});
