import { describe, expect, it } from "vitest";

import { requestIdMiddleware } from "../src/middlewares/index.js";
import { signAccessToken, verifyAccessToken } from "../src/services/index.js";
import { sendSuccess } from "../src/utils/index.js";

const createMockResponse = () => {
  const headers = {};

  return {
    locals: {},
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

describe("Backend Core Utilities", () => {
  it("assigns request id and exposes it in the response helper payload", () => {
    const req = {
      get: () => null,
    };
    const res = createMockResponse();
    let nextCalled = false;

    requestIdMiddleware(req, res, () => {
      nextCalled = true;
    });

    sendSuccess(res, {
      data: { status: "ok" },
    });

    expect(nextCalled).toBe(true);
    expect(req.requestId).toBeTruthy();
    expect(res.getHeader("x-request-id")).toBe(req.requestId);
    expect(res.body.requestId).toBe(req.requestId);
    expect(res.body.data.status).toBe("ok");
  });

  it("signs and verifies jwt access tokens", () => {
    const token = signAccessToken({ sub: "user-123", role: "user" });
    const payload = verifyAccessToken(token);

    expect(payload.sub).toBe("user-123");
    expect(payload.role).toBe("user");
  });
});
