import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, ApiError } from "../../../lib/api";

describe("apiFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockFetch(status: number, body: unknown) {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body)
    });
  }

  it("returns parsed JSON on a successful GET", async () => {
    mockFetch(200, { user: { id: "1" } });
    const result = await apiFetch<{ user: { id: string } }>("/auth/me", { token: "tok" });
    expect(result.user.id).toBe("1");
  });

  it("sends Authorization header when token is provided", async () => {
    mockFetch(200, {});
    await apiFetch("/health", { token: "my-token" });
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.headers["Authorization"]).toBe("Bearer my-token");
  });

  it("does not send Authorization header without token", async () => {
    mockFetch(200, {});
    await apiFetch("/health");
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.headers["Authorization"]).toBeUndefined();
  });

  it("sends JSON body on POST", async () => {
    mockFetch(201, { token: "t" });
    await apiFetch("/auth/login", {
      method: "POST",
      body: { email: "a@b.com", password: "123456" }
    });
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ email: "a@b.com", password: "123456" });
  });

  it("throws ApiError on non-2xx response", async () => {
    mockFetch(401, { message: "Unauthorized" });
    await expect(apiFetch("/auth/me")).rejects.toThrow(ApiError);
  });

  it("ApiError carries the status code and message", async () => {
    mockFetch(404, { message: "Not found" });
    const err = await apiFetch("/missing").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
    expect(err.message).toBe("Not found");
  });

  it("uses a fallback message when response has no message field", async () => {
    mockFetch(500, {});
    const err = await apiFetch("/error").catch((e) => e);
    expect(err.message).toBeDefined();
  });
});
