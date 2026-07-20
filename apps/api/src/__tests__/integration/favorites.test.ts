import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { connect, disconnect, clearCollections } from "../helpers/db.js";
import { createCliente, createCompany, createProduct, tokenFor } from "../helpers/factories.js";

describe("Favorites", () => {
  beforeAll(connect);
  afterAll(disconnect);
  beforeEach(clearCollections);

  it("requires auth", async () => {
    const res = await request(app).get("/favorites");
    expect(res.status).toBe(401);
  });

  it("adds, lists and removes a favorite", async () => {
    const co = await createCompany({ slug: "fav-co" });
    const cliente = await createCliente();
    const product = await createProduct(co._id, { name: "Fav Bike" });
    const auth = `Bearer ${tokenFor(cliente)}`;

    const add = await request(app).post(`/favorites/${product._id}`).set("Authorization", auth);
    expect(add.status).toBe(201);

    const ids = await request(app).get("/favorites/ids").set("Authorization", auth);
    expect(ids.body.productIds).toContain(product._id.toString());

    const list = await request(app).get("/favorites").set("Authorization", auth);
    expect(list.body.products).toHaveLength(1);
    expect(list.body.products[0].name).toBe("Fav Bike");

    const del = await request(app).delete(`/favorites/${product._id}`).set("Authorization", auth);
    expect(del.status).toBe(204);

    const after = await request(app).get("/favorites/ids").set("Authorization", auth);
    expect(after.body.productIds).toHaveLength(0);
  });

  it("is idempotent when adding the same favorite twice", async () => {
    const co = await createCompany({ slug: "fav-co2" });
    const cliente = await createCliente();
    const product = await createProduct(co._id);
    const auth = `Bearer ${tokenFor(cliente)}`;

    await request(app).post(`/favorites/${product._id}`).set("Authorization", auth);
    await request(app).post(`/favorites/${product._id}`).set("Authorization", auth);

    const ids = await request(app).get("/favorites/ids").set("Authorization", auth);
    expect(ids.body.productIds).toHaveLength(1);
  });
});
