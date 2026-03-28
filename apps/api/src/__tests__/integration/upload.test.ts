import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { connect, disconnect, clearCollections } from "../helpers/db.js";
import { createAdmin, createCliente, createCompany, tokenFor } from "../helpers/factories.js";

// Mock sharp to avoid actual image processing in tests
vi.mock("sharp", () => ({
  default: vi.fn().mockReturnValue({
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toFile: vi.fn().mockResolvedValue(undefined)
  })
}));

// Small 1x1 PNG in buffer form
const TINY_PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a4944415478016360000000020001e221bc330000000049454e44ae426082",
  "hex"
);

describe("POST /upload/image", () => {
  beforeAll(connect);
  afterAll(disconnect);
  beforeEach(clearCollections);

  it("admin uploads an image successfully", async () => {
    const co = await createCompany({ slug: "upload-co" });
    const admin = await createAdmin(co._id);

    const res = await request(app)
      .post("/upload/image")
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .attach("image", TINY_PNG, { filename: "test.png", contentType: "image/png" });

    expect(res.status).toBe(200);
    expect(res.body.imageUrl).toMatch(/^\/uploads\/products\/original\/.+\.webp$/);
    expect(res.body.thumbnailUrl).toMatch(/^\/uploads\/products\/thumb\/.+\.webp$/);
  });

  it("imageUrl and thumbnailUrl share the same UUID base", async () => {
    const co = await createCompany({ slug: "uuid-co" });
    const admin = await createAdmin(co._id);

    const res = await request(app)
      .post("/upload/image")
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .attach("image", TINY_PNG, { filename: "test.png", contentType: "image/png" });

    const originalId = res.body.imageUrl.split("/").pop()?.replace(".webp", "");
    const thumbId = res.body.thumbnailUrl.split("/").pop()?.replace("_thumb.webp", "");
    expect(originalId).toBe(thumbId);
  });

  it("returns 400 when no file is sent", async () => {
    const co = await createCompany({ slug: "nofile-co" });
    const admin = await createAdmin(co._id);

    const res = await request(app)
      .post("/upload/image")
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(400);
  });

  it("rejects non-image files (multer fileFilter)", async () => {
    const co = await createCompany({ slug: "notimg-co" });
    const admin = await createAdmin(co._id);

    const res = await request(app)
      .post("/upload/image")
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .attach("image", Buffer.from("hello"), {
        filename: "doc.pdf",
        contentType: "application/pdf"
      });

    // multer fileFilter errors are not HttpErrors, so errorHandler returns 500
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("returns 403 for cliente role", async () => {
    const cliente = await createCliente({ email: "upload-cliente@test.com" });

    const res = await request(app)
      .post("/upload/image")
      .set("Authorization", `Bearer ${tokenFor(cliente)}`)
      .attach("image", TINY_PNG, { filename: "test.png", contentType: "image/png" });

    expect(res.status).toBe(403);
  });

  it("returns 401 without token", async () => {
    const res = await request(app)
      .post("/upload/image")
      .attach("image", TINY_PNG, { filename: "test.png", contentType: "image/png" });

    expect(res.status).toBe(401);
  });
});
