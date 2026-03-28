import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { connect, disconnect, clearCollections } from "../helpers/db.js";
import { createAdmin, createCliente, createCompany, tokenFor } from "../helpers/factories.js";

vi.mock("../../services/chatService.js", () => ({
  runProductAssistant: vi.fn().mockResolvedValue({ answer: "Temos o Botox Facial por R$500." })
}));

import { runProductAssistant } from "../../services/chatService.js";

describe("POST /chat", () => {
  beforeAll(connect);
  afterAll(disconnect);
  beforeEach(clearCollections);

  it("returns answer for authenticated user", async () => {
    const co = await createCompany({ slug: "chat-co" });
    const admin = await createAdmin(co._id);

    const res = await request(app)
      .post("/chat")
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({ message: "Quais tratamentos vocês têm?" });

    expect(res.status).toBe(200);
    expect(res.body.answer).toBe("Temos o Botox Facial por R$500.");
  });

  it("passes message and user to runProductAssistant", async () => {
    const co = await createCompany({ slug: "chat-co2" });
    const admin = await createAdmin(co._id, { email: "chat2@test.com" });

    await request(app)
      .post("/chat")
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({ message: "Tem botox?" });

    expect(runProductAssistant).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Tem botox?" })
    );
  });

  it("works for cliente role", async () => {
    const cliente = await createCliente({ email: "chat-cliente@test.com" });

    const res = await request(app)
      .post("/chat")
      .set("Authorization", `Bearer ${tokenFor(cliente)}`)
      .send({ message: "Quais são os preços?" });

    expect(res.status).toBe(200);
  });

  it("returns 400 for message shorter than 2 characters", async () => {
    const co = await createCompany({ slug: "chat-val-co" });
    const admin = await createAdmin(co._id, { email: "val@test.com" });

    const res = await request(app)
      .post("/chat")
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({ message: "x" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when message is missing", async () => {
    const co = await createCompany({ slug: "chat-miss-co" });
    const admin = await createAdmin(co._id, { email: "miss@test.com" });

    const res = await request(app)
      .post("/chat")
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 401 without token", async () => {
    const res = await request(app)
      .post("/chat")
      .send({ message: "Olá, quais serviços vocês têm?" });

    expect(res.status).toBe(401);
  });

  it("propagates HttpError status codes from the service", async () => {
    const { HttpError } = await import("../../utils/http.js");
    vi.mocked(runProductAssistant).mockRejectedValueOnce(
      new HttpError(503, "OPENAI_API_KEY nao configurada.")
    );

    const co = await createCompany({ slug: "chat-err-co" });
    const admin = await createAdmin(co._id, { email: "err@test.com" });

    const res = await request(app)
      .post("/chat")
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({ message: "Alguma coisa?" });

    expect(res.status).toBe(503);
    expect(res.body.message).toContain("OPENAI_API_KEY");
  });
});
