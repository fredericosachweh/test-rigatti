import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { connect, disconnect, clearCollections } from "../helpers/db.js";
import { createAdmin, createCliente, createCompany, tokenFor } from "../helpers/factories.js";
import { ChatLog } from "../../models/ChatLog.js";

async function createLog(
  companyId: string,
  userId: string,
  overrides: Record<string, unknown> = {}
) {
  return ChatLog.create({
    companyId,
    userId,
    message: "Quais tratamentos vocês têm?",
    toolArgs: null,
    answer: "Temos Botox.",
    provider: "openai",
    ...overrides
  });
}

describe("GET /analytics/heatmap", () => {
  beforeAll(connect);
  afterAll(disconnect);
  beforeEach(clearCollections);

  it("returns heatmap data for admin", async () => {
    const co = await createCompany({ slug: "analytics-co" });
    const admin = await createAdmin(co._id);
    await createLog(co._id.toString(), admin._id.toString());

    const res = await request(app)
      .get("/analytics/heatmap")
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      totalChats: 1,
      topSearchTerms: expect.any(Array),
      topCategories: expect.any(Array),
      priceRangeDistribution: expect.any(Object),
      fieldUsageRate: expect.any(Object),
      providerUsage: expect.any(Object),
      activityGrid: expect.any(Array)
    });
  });

  it("activityGrid has 7 rows and 24 columns", async () => {
    const co = await createCompany({ slug: "grid-co" });
    const admin = await createAdmin(co._id);

    const res = await request(app)
      .get("/analytics/heatmap")
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(200);
    expect(res.body.activityGrid).toHaveLength(7);
    res.body.activityGrid.forEach((row: number[]) => {
      expect(row).toHaveLength(24);
    });
  });

  it("counts only logs for the authenticated company", async () => {
    const co1 = await createCompany({ slug: "heatmap-co1" });
    const co2 = await createCompany({ name: "Other", slug: "heatmap-co2" });
    const admin1 = await createAdmin(co1._id);
    const admin2 = await createAdmin(co2._id, { email: "admin2@test.com" });

    await createLog(co1._id.toString(), admin1._id.toString());
    await createLog(co1._id.toString(), admin1._id.toString());
    await createLog(co2._id.toString(), admin2._id.toString());

    const res = await request(app)
      .get("/analytics/heatmap")
      .set("Authorization", `Bearer ${tokenFor(admin1)}`);

    expect(res.status).toBe(200);
    expect(res.body.totalChats).toBe(2);
  });

  it("aggregates search terms from toolArgs", async () => {
    const co = await createCompany({ slug: "terms-co" });
    const admin = await createAdmin(co._id);
    const id = co._id.toString();
    const uid = admin._id.toString();

    await createLog(id, uid, { toolArgs: { search: "botox" } });
    await createLog(id, uid, { toolArgs: { search: "botox" } });
    await createLog(id, uid, { toolArgs: { search: "peeling" } });

    const res = await request(app)
      .get("/analytics/heatmap")
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(200);
    const terms = res.body.topSearchTerms as { term: string; count: number }[];
    const botox = terms.find((t) => t.term === "botox");
    expect(botox?.count).toBe(2);
  });

  it("aggregates category usage from toolArgs", async () => {
    const co = await createCompany({ slug: "cat-co" });
    const admin = await createAdmin(co._id);
    const id = co._id.toString();
    const uid = admin._id.toString();

    await createLog(id, uid, { toolArgs: { category: "Facial" } });
    await createLog(id, uid, { toolArgs: { category: "Corporal" } });

    const res = await request(app)
      .get("/analytics/heatmap")
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    const cats = res.body.topCategories as { category: string; count: number }[];
    expect(cats.map((c) => c.category)).toContain("Facial");
    expect(cats.map((c) => c.category)).toContain("Corporal");
  });

  it("computes price range distribution from maxPrice toolArgs", async () => {
    const co = await createCompany({ slug: "price-co" });
    const admin = await createAdmin(co._id);
    const id = co._id.toString();
    const uid = admin._id.toString();

    await createLog(id, uid, { toolArgs: { maxPrice: 80 } }); // 0-100
    await createLog(id, uid, { toolArgs: { maxPrice: 300 } }); // 100-500
    await createLog(id, uid, { toolArgs: { maxPrice: 700 } }); // 500-1000
    await createLog(id, uid, { toolArgs: { maxPrice: 1500 } }); // 1000+

    const res = await request(app)
      .get("/analytics/heatmap")
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(res.body.priceRangeDistribution).toMatchObject({
      "0-100": 1,
      "100-500": 1,
      "500-1000": 1,
      "1000+": 1
    });
  });

  it("computes fieldUsageRate correctly", async () => {
    const co = await createCompany({ slug: "rate-co" });
    const admin = await createAdmin(co._id);
    const id = co._id.toString();
    const uid = admin._id.toString();

    // 2 logs, 1 with search, 1 without
    await createLog(id, uid, { toolArgs: { search: "botox" } });
    await createLog(id, uid, { toolArgs: null });

    const res = await request(app)
      .get("/analytics/heatmap")
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    // 1 out of 2 logs has search → 0.5
    expect(res.body.fieldUsageRate.search).toBe(0.5);
  });

  it("counts provider usage", async () => {
    const co = await createCompany({ slug: "prov-co" });
    const admin = await createAdmin(co._id);
    const id = co._id.toString();
    const uid = admin._id.toString();

    await createLog(id, uid, { provider: "openai" });
    await createLog(id, uid, { provider: "openai" });
    await createLog(id, uid, { provider: "anthropic" });

    const res = await request(app)
      .get("/analytics/heatmap")
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(res.body.providerUsage).toMatchObject({ openai: 2, anthropic: 1 });
  });

  it("returns empty data when no logs exist", async () => {
    const co = await createCompany({ slug: "empty-co" });
    const admin = await createAdmin(co._id);

    const res = await request(app)
      .get("/analytics/heatmap")
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(200);
    expect(res.body.totalChats).toBe(0);
    expect(res.body.topSearchTerms).toHaveLength(0);
  });

  it("returns 403 for cliente role", async () => {
    const cliente = await createCliente({ email: "analytics-cliente@test.com" });

    const res = await request(app)
      .get("/analytics/heatmap")
      .set("Authorization", `Bearer ${tokenFor(cliente)}`);

    expect(res.status).toBe(403);
  });

  it("returns 401 without token", async () => {
    const res = await request(app).get("/analytics/heatmap");
    expect(res.status).toBe(401);
  });
});
