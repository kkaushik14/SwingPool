import {
  AuthActionTokenModel,
  AuthSessionModel,
  RevokedTokenModel,
} from "./auth.model.js";

export const authRepository = {
  async createSession(payload) {
    return AuthSessionModel.create(payload);
  },

  async findActiveSessionBySessionId(userId, sessionId) {
    return AuthSessionModel.findOne({
      userId,
      sessionId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });
  },

  async findActiveSessionsByUserId(userId) {
    return AuthSessionModel.find({
      userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });
  },

  async revokeSessionById(sessionId) {
    return AuthSessionModel.findByIdAndUpdate(
      sessionId,
      {
        isRevoked: true,
        revokedAt: new Date(),
      },
      { new: true },
    );
  },

  async revokeSessionBySessionId(userId, sessionId) {
    return AuthSessionModel.findOneAndUpdate(
      {
        userId,
        sessionId,
      },
      {
        isRevoked: true,
        revokedAt: new Date(),
      },
      {
        new: true,
      },
    );
  },

  async revokeAllUserSessions(userId) {
    return AuthSessionModel.updateMany(
      {
        userId,
        isRevoked: false,
      },
      {
        $set: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      },
    );
  },

  async revokeExpiredSessions(now = new Date()) {
    return AuthSessionModel.updateMany(
      {
        expiresAt: { $lte: now },
        isRevoked: false,
      },
      {
        $set: {
          isRevoked: true,
          revokedAt: now,
        },
      },
    );
  },

  async createActionToken(payload) {
    return AuthActionTokenModel.create(payload);
  },

  async findValidActionTokenByHash(tokenHash, purpose) {
    return AuthActionTokenModel.findOne({
      tokenHash,
      purpose,
      isRevoked: false,
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    });
  },

  async revokeActionTokensForUser(userId, purpose) {
    return AuthActionTokenModel.updateMany(
      {
        userId,
        purpose,
        consumedAt: null,
        isRevoked: false,
      },
      {
        $set: {
          isRevoked: true,
        },
      },
    );
  },

  async consumeActionTokenById(actionTokenId) {
    return AuthActionTokenModel.findByIdAndUpdate(
      actionTokenId,
      {
        consumedAt: new Date(),
      },
      { new: true },
    );
  },

  async addRevokedToken(payload) {
    return RevokedTokenModel.findOneAndUpdate(
      {
        jti: payload.jti,
      },
      payload,
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );
  },

  async isTokenRevoked(jti) {
    if (!jti) {
      return false;
    }

    const token = await RevokedTokenModel.findOne({
      jti,
      expiresAt: { $gt: new Date() },
    }).lean();

    return Boolean(token);
  },
};
