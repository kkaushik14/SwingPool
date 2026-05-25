import jwt from "jsonwebtoken";
import { describe, expect, it, vi } from "vitest";

import { config } from "../src/config/index.js";
import {
  AUTH_ACTION_TOKEN_PURPOSES,
  AUTH_TOKEN_TYPES,
} from "../src/components/auth/auth.enums.js";
import { authRepository } from "../src/components/auth/auth.repository.js";
import { authService } from "../src/components/auth/auth.service.js";
import { notificationsService } from "../src/components/notifications/notifications.service.js";
import { NOTIFICATION_EVENT_TYPES } from "../src/components/notifications/notifications.enums.js";
import { usersRepository } from "../src/components/users/users.repository.js";
import { usersService } from "../src/components/users/users.service.js";
import { AuthError, ConflictError } from "../src/errors/index.js";
import { signRefreshToken } from "../src/services/index.js";
import { hashPassword } from "../src/utils/index.js";

const buildUser = (overrides = {}) => ({
  id: "507f1f77bcf86cd799439011",
  email: "user@swingpool.test",
  displayName: "Test User",
  role: "user",
  status: "pending_verification",
  mustRotatePassword: false,
  emailVerifiedAt: null,
  subscriptionStatus: "free",
  ...overrides,
});

const buildProfile = (overrides = {}) => ({
  id: "507f1f77bcf86cd799439099",
  userId: "507f1f77bcf86cd799439011",
  completionStatus: "incomplete",
  verificationStatus: "pending_verification",
  ...overrides,
});

describe("Auth Service", () => {
  it("registers a user and returns tokens with verification preview", async () => {
    const user = buildUser();
    const profile = buildProfile();

    vi.spyOn(usersRepository, "findByEmail").mockResolvedValue(null);
    vi.spyOn(usersRepository, "create").mockResolvedValue(user);
    vi.spyOn(usersRepository, "createProfile").mockResolvedValue(profile);
    vi.spyOn(usersRepository, "findProfileByUserId").mockResolvedValue(profile);

    vi.spyOn(authRepository, "revokeActionTokensForUser").mockResolvedValue({});
    vi.spyOn(authRepository, "createActionToken").mockResolvedValue({
      id: "action-token-1",
    });
    vi.spyOn(authRepository, "createSession").mockResolvedValue({
      id: "session-1",
    });
    const notifySpy = vi
      .spyOn(notificationsService, "dispatchEvent")
      .mockResolvedValue({
        dispatched: true,
      });

    const result = await authService.registerUser({
      email: user.email,
      password: "Register@123",
      displayName: user.displayName,
    });

    expect(result.user.email).toBe(user.email);
    expect(result.tokens.accessToken).toBeTruthy();
    expect(result.tokens.refreshToken).toBeTruthy();
    expect(result.verification.emailVerification.token).toBeTruthy();
    expect(notifySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        eventType: NOTIFICATION_EVENT_TYPES.SIGNUP_VERIFICATION,
      }),
    );
  });

  it("rejects duplicate account registration", async () => {
    vi.spyOn(usersRepository, "findByEmail").mockResolvedValue(buildUser());

    await expect(
      authService.registerUser({
        email: "user@swingpool.test",
        password: "Register@123",
        displayName: "Duplicate",
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects login with invalid credentials", async () => {
    const user = buildUser({
      passwordHash: await hashPassword("Correct@123"),
    });

    vi.spyOn(usersRepository, "findByEmail").mockResolvedValue(user);
    vi.spyOn(usersService, "ensureUserCanAuthenticate").mockResolvedValue(true);

    await expect(
      authService.loginUser({
        email: user.email,
        password: "Wrong@123",
      }),
    ).rejects.toBeInstanceOf(AuthError);
  });

  it("rotates refresh tokens successfully", async () => {
    const user = buildUser({ status: "verified", emailVerifiedAt: new Date() });
    const profile = buildProfile({
      completionStatus: "completed",
      verificationStatus: "verified",
    });

    const refreshPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      tokenType: AUTH_TOKEN_TYPES.REFRESH,
      jti: "refresh-jti-old",
      sessionId: "session-old",
    };

    const refreshToken = signRefreshToken(refreshPayload);
    const refreshTokenHash = await hashPassword(refreshToken);

    vi.spyOn(authRepository, "isTokenRevoked").mockResolvedValue(false);
    vi.spyOn(authRepository, "findActiveSessionBySessionId").mockResolvedValue({
      id: "session-record-id",
      refreshTokenHash,
    });
    vi.spyOn(authRepository, "revokeSessionById").mockResolvedValue({});
    vi.spyOn(authRepository, "addRevokedToken").mockResolvedValue({});
    vi.spyOn(authRepository, "createSession").mockResolvedValue({
      id: "new-session-id",
    });

    vi.spyOn(usersRepository, "findById").mockResolvedValue(user);
    vi.spyOn(usersRepository, "findProfileByUserId").mockResolvedValue(profile);

    const result = await authService.refreshTokens(refreshToken);

    expect(result.tokens.accessToken).toBeTruthy();
    expect(result.tokens.refreshToken).toBeTruthy();
    expect(result.tokens.refreshToken).not.toBe(refreshToken);
  });

  it("rejects invalid refresh token", async () => {
    await expect(
      authService.refreshTokens("invalid-token"),
    ).rejects.toBeInstanceOf(AuthError);
  });

  it("rejects expired refresh token", async () => {
    const expiredToken = jwt.sign(
      {
        sub: "507f1f77bcf86cd799439011",
        tokenType: AUTH_TOKEN_TYPES.REFRESH,
        jti: "expired-jti",
        sessionId: "expired-session",
      },
      config.auth.refreshTokenSecret,
      {
        expiresIn: -10,
      },
    );

    await expect(
      authService.refreshTokens(expiredToken),
    ).rejects.toBeInstanceOf(AuthError);
  });

  it("rejects invalid email verification token", async () => {
    vi.spyOn(authRepository, "findValidActionTokenByHash").mockResolvedValue(
      null,
    );

    await expect(
      authService.verifyEmailToken("missing-token"),
    ).rejects.toBeInstanceOf(AuthError);
  });

  it("returns generic forgot password response for unknown accounts", async () => {
    vi.spyOn(usersRepository, "findByEmail").mockResolvedValue(null);

    const result = await authService.forgotPassword("unknown@swingpool.test");

    expect(result.dispatched).toBe(true);
  });

  it("rejects password reset for invalid token", async () => {
    vi.spyOn(authRepository, "findValidActionTokenByHash").mockResolvedValue(
      null,
    );

    await expect(
      authService.resetPassword("invalid", "NewPassword@123"),
    ).rejects.toBeInstanceOf(AuthError);
  });

  it("creates password reset token for known user", async () => {
    const user = buildUser();

    vi.spyOn(usersRepository, "findByEmail").mockResolvedValue(user);
    vi.spyOn(authRepository, "revokeActionTokensForUser").mockResolvedValue({});
    vi.spyOn(authRepository, "createActionToken").mockResolvedValue({
      id: "password-reset-token",
    });

    const result = await authService.forgotPassword(user.email);

    expect(result.dispatched).toBe(true);
    expect(result.passwordReset.token).toBeTruthy();
  });

  it("rejects logout when refresh token belongs to another user", async () => {
    const user = buildUser();

    const refreshToken = signRefreshToken({
      sub: "507f191e810c19729de860ea",
      tokenType: AUTH_TOKEN_TYPES.REFRESH,
      jti: "refresh-jti",
      sessionId: "session-id",
    });

    vi.spyOn(authRepository, "isTokenRevoked").mockResolvedValue(false);

    await expect(
      authService.logoutUser(user.id, refreshToken, {
        jti: "access-jti",
        exp: Math.floor(Date.now() / 1000) + 300,
      }),
    ).rejects.toBeInstanceOf(AuthError);
  });

  it("consumes verification token with correct purpose", async () => {
    const user = buildUser();

    vi.spyOn(authRepository, "findValidActionTokenByHash").mockResolvedValue({
      id: "token-record-id",
      userId: user.id,
      purpose: AUTH_ACTION_TOKEN_PURPOSES.EMAIL_VERIFICATION,
    });
    vi.spyOn(authRepository, "consumeActionTokenById").mockResolvedValue({
      id: "token-record-id",
    });
    vi.spyOn(usersService, "markEmailVerified").mockResolvedValue({
      id: user.id,
      status: "verified",
    });

    const result = await authService.verifyEmailToken("token-value");

    expect(result.verified).toBe(true);
    expect(result.user.status).toBe("verified");
  });
});
