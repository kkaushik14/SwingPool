import { describe, expect, it, vi } from "vitest";

import { AUTH_TOKEN_TYPES } from "../src/components/auth/auth.enums.js";
import { authRepository } from "../src/components/auth/auth.repository.js";
import { usersRepository } from "../src/components/users/users.repository.js";
import { USER_STATUSES } from "../src/enums/index.js";
import { authenticate } from "../src/middlewares/index.js";
import { signAccessToken, signRefreshToken } from "../src/services/index.js";

const buildRequest = ({ authorization } = {}) => ({
  headers: {
    authorization,
  },
});

const runAuthenticate = async (requestOverrides = {}) => {
  const req = buildRequest(requestOverrides);
  let nextError;

  await authenticate(req, {}, (error) => {
    nextError = error;
  });

  return {
    req,
    error: nextError,
  };
};

describe("Auth Middleware", () => {
  it("rejects missing bearer token", async () => {
    const { error } = await runAuthenticate();

    expect(error).toBeTruthy();
    expect(error.message).toContain("Bearer token");
  });

  it("rejects revoked access token", async () => {
    const accessToken = signAccessToken({
      sub: "507f1f77bcf86cd799439011",
      role: "user",
      tokenType: AUTH_TOKEN_TYPES.ACCESS,
      jti: "revoked-jti",
      sessionId: "session-1",
    });

    vi.spyOn(authRepository, "isTokenRevoked").mockResolvedValue(true);

    const { error } = await runAuthenticate({
      authorization: `Bearer ${accessToken}`,
    });

    expect(error).toBeTruthy();
    expect(error.message).toContain("revoked");
  });

  it("rejects refresh token on access protected routes", async () => {
    const refreshToken = signRefreshToken({
      sub: "507f1f77bcf86cd799439011",
      role: "user",
      tokenType: AUTH_TOKEN_TYPES.REFRESH,
      jti: "refresh-jti",
      sessionId: "session-1",
    });

    const { error } = await runAuthenticate({
      authorization: `Bearer ${refreshToken}`,
    });

    expect(error).toBeTruthy();
    expect(error.message).toContain("invalid or expired");
  });

  it("rejects suspended users", async () => {
    const accessToken = signAccessToken({
      sub: "507f1f77bcf86cd799439011",
      role: "user",
      tokenType: AUTH_TOKEN_TYPES.ACCESS,
      jti: "access-jti",
      sessionId: "session-1",
    });

    vi.spyOn(authRepository, "isTokenRevoked").mockResolvedValue(false);
    vi.spyOn(usersRepository, "findById").mockResolvedValue({
      id: "507f1f77bcf86cd799439011",
      status: USER_STATUSES.SUSPENDED,
    });

    const { error } = await runAuthenticate({
      authorization: `Bearer ${accessToken}`,
    });

    expect(error).toBeTruthy();
    expect(error.message).toContain("suspended");
  });

  it("allows valid active access token", async () => {
    const accessToken = signAccessToken({
      sub: "507f1f77bcf86cd799439011",
      role: "user",
      tokenType: AUTH_TOKEN_TYPES.ACCESS,
      jti: "access-jti-valid",
      sessionId: "session-1",
    });

    vi.spyOn(authRepository, "isTokenRevoked").mockResolvedValue(false);
    vi.spyOn(usersRepository, "findById").mockResolvedValue({
      id: "507f1f77bcf86cd799439011",
      role: "user",
      status: USER_STATUSES.PENDING_VERIFICATION,
    });

    const { error, req } = await runAuthenticate({
      authorization: `Bearer ${accessToken}`,
    });

    expect(error).toBeUndefined();
    expect(req.auth.sub).toBe("507f1f77bcf86cd799439011");
  });
});
