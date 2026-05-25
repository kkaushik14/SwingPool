import mongoose from "mongoose";

import { SCORES_STATUSES, SCORE_SOURCES } from "./scores.enums.js";

const scoresSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    playedDate: { type: Date, required: true, index: true },
    playedDateKey: { type: String, required: true, index: true },
    value: { type: Number, required: true, min: 1, max: 45, index: true },
    contestNumber: { type: Number, required: true, min: 1, index: true },
    status: {
      type: String,
      enum: Object.values(SCORES_STATUSES),
      default: SCORES_STATUSES.ACTIVE,
      index: true,
    },
    source: {
      type: String,
      enum: Object.values(SCORE_SOURCES),
      default: SCORE_SOURCES.USER,
      index: true,
      immutable: true,
    },
    submittedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
      immutable: true,
    },
    submissionLocalDateKey: {
      type: String,
      required: true,
      index: true,
      immutable: true,
    },
    isBackdated: { type: Boolean, required: true, default: false, index: true },
    confirmedAt: { type: Date, default: Date.now, immutable: true },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      immutable: true,
    },
    adminEditCount: { type: Number, default: 0, min: 0 },
    lastAdminEditedAt: { type: Date, default: null },
    lastAdminEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    lastAdminEditReason: { type: String, default: "", trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

scoresSchema.index({ userId: 1, submittedAt: -1, createdAt: -1 });
scoresSchema.index({ userId: 1, status: 1, isBackdated: 1, submittedAt: -1 });
scoresSchema.index({ userId: 1, contestNumber: 1, submittedAt: -1 });

export const ScoreModel =
  mongoose.models.Score || mongoose.model("Score", scoresSchema);
