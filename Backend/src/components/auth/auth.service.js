import { createHash, randomBytes, randomUUID } from "node:crypto";

import { config } from "../../config/index.js";
import { AppError, AuthError, ConflictError } from "../../errors/index.js";
import {
  logAuditEvent,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../services/index.js";
import {
  comparePassword,
  hashPassword,
  parseDurationToMilliseconds,
} from "../../utils/index.js";
import { usersRepository } from "../users/users.repository.js";
import { usersService } from "../users/users.service.js";
import { NOTIFICATION_EVENT_TYPES } from "../notifications/notifications.enums.js";
import { dispatchNotificationEvent } from "../notifications/notifications.dispatcher.js";

import { toAuthResponseDto } from "./auth.dto.js";
import { AUTH_ACTION_TOKEN_PURPOSES, AUTH_TOKEN_TYPES } from "./auth.enums.js";
import { authRepository } from "./auth.repository.js";

const generateOpaqueToken = () => randomBytes(48).toString("base64url");
const hashOpaqueToken = (token) =>
  createHash("sha256").update(token).digest("hex");

const normalizeEmail = (email) => email.trim().toLowerCase();

const resolveVerificationPreviewPayload = ({ token, expiresAt }) => {
  if (config.isProduction) {
    return null;
  }

  return {
    token,
    expiresAt,
  };
};

const mapTokenPayload = (user, extra = {}) => ({
  sub: user.id,
  email: user.email,
  role: user.role,
  status: user.status,
  ...extra,
});

const resolveExpiryDateFromJwtPayload = (payload) => {
  if (payload?.exp) {
    return new Date(payload.exp * 1000);
  }

  return new Date(Date.now() + config.auth.refreshTokenExpiresInMs);
};

const issueTokenPair = async (user, requestContext = {}) => {
  const sessionId = randomUUID();
  const accessTokenJti = randomUUID();
  const refreshTokenJti = randomUUID();

  const accessToken = signAccessToken(
    mapTokenPayload(user, {
      tokenType: AUTH_TOKEN_TYPES.ACCESS,
      jti: accessTokenJti,
      sessionId,
    }),
  );

  const refreshToken = signRefreshToken(
    mapTokenPayload(user, {
      tokenType: AUTH_TOKEN_TYPES.REFRESH,
      jti: refreshTokenJti,
      sessionId,
    }),
  );

  const refreshTokenHash = await hashPassword(refreshToken);

  await authRepository.createSession({
    userId: user.id,
    sessionId,
    refreshTokenJti,
    refreshTokenHash,
    userAgent: requestContext.userAgent || "",
    ipAddress: requestContext.ipAddress || "",
    expiresAt: new Date(Date.now() + config.auth.refreshTokenExpiresInMs),
  });

  return {
    accessToken,
    refreshToken,
    sessionId,
    accessTokenJti,
    refreshTokenJti,
    accessTokenExpiresIn: config.auth.accessTokenExpiresIn,
    refreshTokenExpiresIn: config.auth.refreshTokenExpiresIn,
  };
};

const createActionToken = async ({
  userId,
  purpose,
  metadata = {},
  expiresIn,
}) => {
  const token = generateOpaqueToken();
  const tokenHash = hashOpaqueToken(token);
  const expiresAt = new Date(
    Date.now() + parseDurationToMilliseconds(expiresIn),
  );

  await authRepository.createActionToken({
    userId,
    purpose,
    tokenHash,
    expiresAt,
    metadata,
  });

  return {
    token,
    expiresAt,
  };
};

const revokeTokenIfPresent = async ({
  userId,
  jti,
  tokenType,
  reason,
  expiresAt,
}) => {
  if (!jti) {
    return;
  }

  await authRepository.addRevokedToken({
    userId,
    jti,
    tokenType,
    reason,
    expiresAt,
  });
};

const verifyAndValidateRefreshToken = async (refreshToken) => {
  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (_error) {
    throw new AuthError("Refresh token is invalid or expired.");
  }

  if (
    payload?.tokenType !== AUTH_TOKEN_TYPES.REFRESH ||
    !payload?.sessionId ||
    !payload?.jti
  ) {
    throw new AuthError("Refresh token payload is invalid.");
  }

  const isRevoked = await authRepository.isTokenRevoked(payload.jti);

  if (isRevoked) {
    throw new AuthError("Refresh token has been revoked.");
  }

  return payload;
};

const createRegistrationProfilePayload = ({ userId, displayName }) => {
  const [firstName = "", ...rest] = displayName.trim().split(" ");

  return {
    userId,
    firstName,
    lastName: rest.join(" "),
  };
};

export const authService = {
  async registerUser({ email, password, displayName }, requestContext = {}) {
    const normalizedEmail = normalizeEmail(email);
    const existingUser = await usersRepository.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictError("A user with this email already exists.");
    }

    const passwordHash = await hashPassword(password);

    const createdUser = await usersRepository.create({
      email: normalizedEmail,
      passwordHash,
      displayName,
    });

    await usersRepository.createProfile(
      createRegistrationProfilePayload({
        userId: createdUser.id,
        displayName,
      }),
    );

    await authRepository.revokeActionTokensForUser(
      createdUser.id,
      AUTH_ACTION_TOKEN_PURPOSES.EMAIL_VERIFICATION,
    );

    const emailVerificationToken = await createActionToken({
      userId: createdUser.id,
      purpose: AUTH_ACTION_TOKEN_PURPOSES.EMAIL_VERIFICATION,
      expiresIn: config.auth.emailVerificationTokenExpiresIn,
      metadata: {
        email: normalizedEmail,
      },
    });

    const tokens = await issueTokenPair(createdUser, requestContext);
    const profile = await usersRepository.findProfileByUserId(createdUser.id);

    dispatchNotificationEvent({
      scope: "auth",
      userId: createdUser.id,
      eventType: NOTIFICATION_EVENT_TYPES.SIGNUP_VERIFICATION,
      context: {
        expiresAt: emailVerificationToken.expiresAt,
      },
      dedupeKey: `signup-verification:${createdUser.id}:${new Date(emailVerificationToken.expiresAt).toISOString()}`,
      requestContext,
    });

    logAuditEvent({
      action: "auth.register",
      actorId: createdUser.id,
      actorRole: createdUser.role,
      entity: "User",
      entityId: createdUser.id,
      requestId: requestContext.requestId,
      metadata: {
        email: normalizedEmail,
      },
    });

    return toAuthResponseDto({
      user: createdUser,
      profile,
      tokens,
      verification: {
        emailVerification: resolveVerificationPreviewPayload(
          emailVerificationToken,
        ),
      },
    });
  },

  async loginUser({ email, password }, requestContext = {}) {
    const normalizedEmail = normalizeEmail(email);
    const existingUser = await usersRepository.findByEmail(normalizedEmail);

    if (!existingUser) {
      throw new AuthError("Invalid credentials.");
    }

    await usersService.ensureUserCanAuthenticate(existingUser);

    const passwordMatches = await comparePassword(
      password,
      existingUser.passwordHash,
    );

    if (!passwordMatches) {
      throw new AuthError("Invalid credentials.");
    }

    await usersService.touchLastLogin(existingUser.id);

    const tokens = await issueTokenPair(existingUser, requestContext);
    const profile = await usersRepository.findProfileByUserId(existingUser.id);

    logAuditEvent({
      action: "auth.login",
      actorId: existingUser.id,
      actorRole: existingUser.role,
      entity: "User",
      entityId: existingUser.id,
      requestId: requestContext.requestId,
    });

    return toAuthResponseDto({
      user: existingUser,
      profile,
      tokens,
      verification: {
        requiresPasswordRotation: Boolean(existingUser.mustRotatePassword),
      },
    });
  },

  async refreshTokens(refreshToken, requestContext = {}) {
    const payload = await verifyAndValidateRefreshToken(refreshToken);

    const session = await authRepository.findActiveSessionBySessionId(
      payload.sub,
      payload.sessionId,
    );

    if (!session) {
      throw new AuthError("Refresh token is invalid or has been revoked.");
    }

    const refreshTokenMatches = await comparePassword(
      refreshToken,
      session.refreshTokenHash,
    );

    if (!refreshTokenMatches) {
      await authRepository.revokeSessionById(session.id);
      await revokeTokenIfPresent({
        userId: payload.sub,
        jti: payload.jti,
        tokenType: AUTH_TOKEN_TYPES.REFRESH,
        reason: "refresh_reuse_detected",
        expiresAt: resolveExpiryDateFromJwtPayload(payload),
      });

      throw new AuthError("Refresh token is invalid or has been revoked.");
    }

    await authRepository.revokeSessionById(session.id);

    await revokeTokenIfPresent({
      userId: payload.sub,
      jti: payload.jti,
      tokenType: AUTH_TOKEN_TYPES.REFRESH,
      reason: "refresh_rotated",
      expiresAt: resolveExpiryDateFromJwtPayload(payload),
    });

    const user = await usersRepository.findById(payload.sub);

    if (!user) {
      throw new AuthError("User account is no longer available.");
    }

    await usersService.ensureUserCanAuthenticate(user);

    const tokens = await issueTokenPair(user, requestContext);
    const profile = await usersRepository.findProfileByUserId(user.id);

    logAuditEvent({
      action: "auth.refresh",
      actorId: user.id,
      actorRole: user.role,
      entity: "AuthSession",
      entityId: session.id,
      requestId: requestContext.requestId,
    });

    return toAuthResponseDto({
      user,
      profile,
      tokens,
      verification: null,
    });
  },

  async logoutUser(
    userId,
    refreshToken,
    accessTokenPayload = {},
    requestContext = {},
  ) {
    const payload = await verifyAndValidateRefreshToken(refreshToken);

    if (payload.sub !== userId) {
      throw new AuthError(
        "Refresh token does not belong to authenticated user.",
      );
    }

    const session = await authRepository.revokeSessionBySessionId(
      userId,
      payload.sessionId,
    );

    await revokeTokenIfPresent({
      userId,
      jti: payload.jti,
      tokenType: AUTH_TOKEN_TYPES.REFRESH,
      reason: "logout",
      expiresAt: resolveExpiryDateFromJwtPayload(payload),
    });

    await revokeTokenIfPresent({
      userId,
      jti: accessTokenPayload?.jti,
      tokenType: AUTH_TOKEN_TYPES.ACCESS,
      reason: "logout",
      expiresAt: resolveExpiryDateFromJwtPayload(accessTokenPayload),
    });

    logAuditEvent({
      action: "auth.logout",
      actorId: userId,
      actorRole: requestContext.role,
      entity: "AuthSession",
      entityId: session?.id || null,
      requestId: requestContext.requestId,
    });

    return {
      revoked: Boolean(session),
    };
  },

  async verifyEmailToken(token, requestContext = {}) {
    const tokenHash = hashOpaqueToken(token);

    const actionToken = await authRepository.findValidActionTokenByHash(
      tokenHash,
      AUTH_ACTION_TOKEN_PURPOSES.EMAIL_VERIFICATION,
    );

    if (!actionToken) {
      throw new AuthError("Email verification token is invalid or expired.");
    }

    await authRepository.consumeActionTokenById(actionToken.id);

    const userDto = await usersService.markEmailVerified(
      actionToken.userId,
      requestContext,
    );

    logAuditEvent({
      action: "auth.email.verify",
      actorId: actionToken.userId,
      actorRole: "user",
      entity: "AuthActionToken",
      entityId: actionToken.id,
      requestId: requestContext.requestId,
    });

    return {
      user: userDto,
      verified: true,
    };
  },

  async resendEmailVerification(email, requestContext = {}) {
    const normalizedEmail = normalizeEmail(email);
    const user = await usersRepository.findByEmail(normalizedEmail);

    if (!user) {
      return {
        dispatched: true,
      };
    }

    await authRepository.revokeActionTokensForUser(
      user.id,
      AUTH_ACTION_TOKEN_PURPOSES.EMAIL_VERIFICATION,
    );

    const emailVerificationToken = await createActionToken({
      userId: user.id,
      purpose: AUTH_ACTION_TOKEN_PURPOSES.EMAIL_VERIFICATION,
      expiresIn: config.auth.emailVerificationTokenExpiresIn,
      metadata: {
        email: normalizedEmail,
      },
    });

    dispatchNotificationEvent({
      scope: "auth",
      userId: user.id,
      eventType: NOTIFICATION_EVENT_TYPES.SIGNUP_VERIFICATION,
      context: {
        expiresAt: emailVerificationToken.expiresAt,
      },
      dedupeKey: `signup-verification-resend:${user.id}:${new Date(emailVerificationToken.expiresAt).toISOString()}`,
      requestContext,
    });

    logAuditEvent({
      action: "auth.email.resend",
      actorId: user.id,
      actorRole: user.role,
      entity: "User",
      entityId: user.id,
      requestId: requestContext.requestId,
    });

    return {
      dispatched: true,
      emailVerification: resolveVerificationPreviewPayload(
        emailVerificationToken,
      ),
    };
  },

  async forgotPassword(email, requestContext = {}) {
    const normalizedEmail = normalizeEmail(email);
    const user = await usersRepository.findByEmail(normalizedEmail);

    if (!user) {
      return {
        dispatched: true,
      };
    }

    await authRepository.revokeActionTokensForUser(
      user.id,
      AUTH_ACTION_TOKEN_PURPOSES.PASSWORD_RESET,
    );

    const passwordResetToken = await createActionToken({
      userId: user.id,
      purpose: AUTH_ACTION_TOKEN_PURPOSES.PASSWORD_RESET,
      expiresIn: config.auth.passwordResetTokenExpiresIn,
      metadata: {
        email: normalizedEmail,
      },
    });

    logAuditEvent({
      action: "auth.password.forgot",
      actorId: user.id,
      actorRole: user.role,
      entity: "User",
      entityId: user.id,
      requestId: requestContext.requestId,
    });

    return {
      dispatched: true,
      passwordReset: resolveVerificationPreviewPayload(passwordResetToken),
    };
  },

  async resetPassword(token, newPassword, requestContext = {}) {
    const tokenHash = hashOpaqueToken(token);

    const actionToken = await authRepository.findValidActionTokenByHash(
      tokenHash,
      AUTH_ACTION_TOKEN_PURPOSES.PASSWORD_RESET,
    );

    if (!actionToken) {
      throw new AuthError("Password reset token is invalid or expired.");
    }

    const user = await usersRepository.findById(actionToken.userId);

    if (!user) {
      throw AppError.notFound("User account not found.");
    }

    const passwordHash = await hashPassword(newPassword);
    await usersService.updatePassword(user.id, passwordHash);

    const activeSessions = await authRepository.findActiveSessionsByUserId(
      user.id,
    );

    await Promise.all(
      activeSessions.map((session) =>
        Promise.all([
          authRepository.revokeSessionById(session.id),
          revokeTokenIfPresent({
            userId: user.id,
            jti: session.refreshTokenJti,
            tokenType: AUTH_TOKEN_TYPES.REFRESH,
            reason: "password_reset",
            expiresAt: session.expiresAt,
          }),
        ]),
      ),
    );

    await authRepository.consumeActionTokenById(actionToken.id);

    logAuditEvent({
      action: "auth.password.reset",
      actorId: user.id,
      actorRole: user.role,
      entity: "AuthActionToken",
      entityId: actionToken.id,
      requestId: requestContext.requestId,
    });

    return {
      reset: true,
    };
  },
};
