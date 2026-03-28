import { describe, expect, it } from "vitest";
import { HttpError } from "../../../utils/http.js";

describe("HttpError", () => {
  it("sets statusCode and message", () => {
    const err = new HttpError(404, "Not found");
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Not found");
  });

  it("is an instance of Error", () => {
    const err = new HttpError(500, "Server error");
    expect(err).toBeInstanceOf(Error);
  });

  it("works with different status codes", () => {
    expect(new HttpError(401, "Unauthorized").statusCode).toBe(401);
    expect(new HttpError(403, "Forbidden").statusCode).toBe(403);
    expect(new HttpError(409, "Conflict").statusCode).toBe(409);
  });
});
