import mongoose from "mongoose";

import { AUTH_ACTION_TOKEN_PURPOSES, AUTH_TOKEN_TYPES } from "./auth.enums.js";

const authSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    refreshTokenJti: {
      type: String,
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      default: "",
    },
    ipAddress: {
      type: String,
      default: "",
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

authSessionSchema.index({ userId: 1, sessionId: 1 }, { unique: true });

authSessionSchema.index({ userId: 1, isRevoked: 1 });

const authActionTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: Object.values(AUTH_ACTION_TOKEN_PURPOSES),
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

authActionTokenSchema.index({ userId: 1, purpose: 1, isRevoked: 1 });

const revokedTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    jti: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    tokenType: {
      type: String,
      enum: Object.values(AUTH_TOKEN_TYPES),
      required: true,
      index: true,
    },
    reason: {
      type: String,
      default: "revoked",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

revokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuthSessionModel =
  mongoose.models.AuthSession ||
  mongoose.model("AuthSession", authSessionSchema);

export const AuthActionTokenModel =
  mongoose.models.AuthActionToken ||
  mongoose.model("AuthActionToken", authActionTokenSchema);

export const RevokedTokenModel =
  mongoose.models.RevokedToken ||
  mongoose.model("RevokedToken", revokedTokenSchema);
