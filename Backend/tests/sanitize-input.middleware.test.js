import { describe, expect, it } from "vitest";

import { sanitizeInputMiddleware } from "../src/middlewares/index.js";

describe("Sanitize Input Middleware", () => {
  it("sanitizes getter-based query objects without reassigning req.query", () => {
    const query = {
      search: "  swing  ",
      nested: {
        city: "  Pune  ",
      },
      $where: "malicious",
    };

    const req = {
      body: {
        displayName: "  Test User  ",
      },
      params: {
        id: " 507f1f77bcf86cd799439011 ",
      },
    };

    Object.defineProperty(req, "query", {
      configurable: true,
      enumerable: true,
      get() {
        return query;
      },
    });

    const middleware = sanitizeInputMiddleware();
    let nextError;

    middleware(req, {}, (error) => {
      nextError = error;
    });

    expect(nextError).toBeUndefined();
    expect(req.body).toEqual({
      displayName: "Test User",
    });
    expect(req.params).toEqual({
      id: "507f1f77bcf86cd799439011",
    });
    expect(req.query).toEqual({
      search: "swing",
      nested: {
        city: "Pune",
      },
    });
  });
});
