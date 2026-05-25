import { describe, expect, it } from "vitest";

import { registerRoutes } from "../src/routes/index.js";
import { healthRouter } from "../src/routes/health.route.js";

const createMockResponse = () => {
  const headers = {};

  return {
    locals: {
      requestId: "req-test-123",
    },
    statusCode: 200,
    body: null,
    setHeader(name, value) {
      headers[name.toLowerCase()] = value;
    },
    getHeader(name) {
      return headers[name.toLowerCase()];
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
};

const getRouterHandler = (router, routePath, method) => {
  const layer = router.stack.find(
    (item) =>
      item.route?.path === routePath && item.route?.methods?.[method] === true,
  );

  return layer?.route?.stack?.[0]?.handle;
};

describe("Route Response Contracts", () => {
  it("returns the standard success contract on the root discovery endpoint", () => {
    const registeredGetHandlers = new Map();
    const app = {
      get(path, handler) {
        registeredGetHandlers.set(path, handler);
      },
      use() {},
    };

    registerRoutes(app);

    const rootHandler = registeredGetHandlers.get("/");
    const res = createMockResponse();

    rootHandler({}, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.objectContaining({
          name: "Swing Pool Backend",
          docs: "/api-docs",
          versionedBasePath: "/api/v1",
        }),
        requestId: "req-test-123",
        timestamp: expect.any(String),
      }),
    );
  });

  it("returns the standard success contract on the health endpoint", () => {
    const healthHandler = getRouterHandler(healthRouter, "/health", "get");
    const res = createMockResponse();

    healthHandler({}, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.objectContaining({
          status: "ok",
          environment: "test",
          timezone: "Asia/Kolkata",
        }),
        requestId: "req-test-123",
        timestamp: expect.any(String),
      }),
    );
  });
});
