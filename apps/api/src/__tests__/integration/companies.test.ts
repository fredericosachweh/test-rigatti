import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { connect, disconnect, clearCollections } from "../helpers/db.js";
import { createAdmin, createCliente, createCompany, tokenFor } from "../helpers/factories.js";

describe("GET /companies", () => {
  beforeAll(connect);
  afterAll(disconnect);
  beforeEach(clearCollections);

  it("returns all companies for an authenticated admin", async () => {
    const co = await createCompany({ slug: "co-a" });
    await createCompany({ name: "Co B", slug: "co-b" });
    const admin = await createAdmin(co._id);

    const res = await request(app)
      .get("/companies")
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(200);
    expect(res.body.companies).toHaveLength(2);
    expect(res.body.companies[0]).toMatchObject({
      name: expect.any(String),
      slug: expect.any(String)
    });
  });

  it("returns all companies for an authenticated cliente", async () => {
    await createCompany({ slug: "co-c" });
    await createCompany({ name: "Co D", slug: "co-d" });
    const cliente = await createCliente();

    const res = await request(app)
      .get("/companies")
      .set("Authorization", `Bearer ${tokenFor(cliente)}`);

    expect(res.status).toBe(200);
    expect(res.body.companies).toHaveLength(2);
  });

  it("returns 401 without token", async () => {
    const res = await request(app).get("/companies");
    expect(res.status).toBe(401);
  });

  it("returns empty array when no companies exist", async () => {
    const cliente = await createCliente();

    const res = await request(app)
      .get("/companies")
      .set("Authorization", `Bearer ${tokenFor(cliente)}`);

    expect(res.status).toBe(200);
    expect(res.body.companies).toHaveLength(0);
  });

  it("returns companies sorted by name", async () => {
    await createCompany({ name: "Zebra Co", slug: "zebra-co" });
    await createCompany({ name: "Alpha Co", slug: "alpha-co" });
    const cliente = await createCliente();

    const res = await request(app)
      .get("/companies")
      .set("Authorization", `Bearer ${tokenFor(cliente)}`);

    const names = res.body.companies.map((c: { name: string }) => c.name);
    expect(names).toEqual([...names].sort());
  });
});
