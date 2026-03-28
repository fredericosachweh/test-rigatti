import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { connect, disconnect, clearCollections } from "../helpers/db.js";
import { createAdmin, createCompany, tokenFor } from "../helpers/factories.js";

describe("POST /auth/register", () => {
  beforeAll(connect);
  afterAll(disconnect);
  beforeEach(clearCollections);

  it("creates an admin with a new company", async () => {
    const res = await request(app).post("/auth/register").send({
      name: "Dra. Ana",
      email: "ana@clinic.com",
      password: "senha123",
      role: "admin",
      companyName: "Clínica Ana"
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("admin");
    expect(res.body.token).toBeDefined();
  });

  it("creates a cliente without company", async () => {
    const res = await request(app).post("/auth/register").send({
      name: "Cliente Demo",
      email: "cliente@test.com",
      password: "senha123",
      role: "cliente"
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("cliente");
    expect(res.body.user.companyId).toBe("");
  });

  it("creates a admin joining existing company via slug", async () => {
    const company = await createCompany({ name: "Existing Co", slug: "existing-co" });
    const res = await request(app).post("/auth/register").send({
      name: "New Admin",
      email: "newadmin@test.com",
      password: "senha123",
      role: "admin",
      companySlug: company.slug
    });

    expect(res.status).toBe(201);
    expect(res.body.user.companyId).toBe(company._id.toString());
  });

  it("returns 409 when email is already taken", async () => {
    const company = await createCompany({ slug: "dup-co" });
    await createAdmin(company._id, { email: "dup@test.com" });

    const res = await request(app).post("/auth/register").send({
      name: "Dup",
      email: "dup@test.com",
      password: "senha123",
      role: "cliente"
    });

    expect(res.status).toBe(409);
  });

  it("returns 409 when company slug already exists", async () => {
    await createCompany({ slug: "taken-slug" });

    const res = await request(app).post("/auth/register").send({
      name: "Someone",
      email: "someone@test.com",
      password: "senha123",
      role: "admin",
      companyName: "Taken Slug",
      companySlug: "taken-slug"
    });

    expect(res.status).toBe(409);
  });

  it("returns 404 when joining a slug that does not exist", async () => {
    const res = await request(app).post("/auth/register").send({
      name: "Ghost",
      email: "ghost@test.com",
      password: "senha123",
      role: "admin",
      companySlug: "no-such-slug"
    });

    expect(res.status).toBe(404);
  });

  it("returns 400 for missing required fields", async () => {
    const res = await request(app).post("/auth/register").send({ email: "x@x.com" });
    expect(res.status).toBe(400);
  });
});

describe("POST /auth/login", () => {
  beforeAll(connect);
  afterAll(disconnect);
  beforeEach(clearCollections);

  it("returns token and user for valid credentials", async () => {
    const company = await createCompany({ slug: "login-co" });
    await createAdmin(company._id, { email: "login@test.com" });

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "login@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("login@test.com");
  });

  it("returns 401 for wrong password", async () => {
    const company = await createCompany({ slug: "pw-co" });
    await createAdmin(company._id, { email: "pw@test.com" });

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "pw@test.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
  });

  it("returns 401 for unknown email", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "nobody@test.com", password: "senha123" });

    expect(res.status).toBe(401);
  });
});

describe("GET /auth/me", () => {
  beforeAll(connect);
  afterAll(disconnect);
  beforeEach(clearCollections);

  it("returns the authenticated user", async () => {
    const company = await createCompany({ slug: "me-co" });
    const user = await createAdmin(company._id);
    const token = tokenFor(user);

    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.role).toBe("admin");
  });

  it("returns 401 without token", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns 401 with an invalid token", async () => {
    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", "Bearer invalid.token.here");
    expect(res.status).toBe(401);
  });
});
