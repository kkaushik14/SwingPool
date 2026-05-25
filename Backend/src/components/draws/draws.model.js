import mongoose from "mongoose";

import { DRAW_MODES, DRAW_SNAPSHOT_STATUSES } from "./draws.enums.js";

const drawsSchema = new mongoose.Schema(
  {
    drawMonthKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    month: { type: Number, required: true, min: 1, max: 12, index: true },
    year: { type: Number, required: true, min: 2024, index: true },
    mode: {
      type: String,
      enum: Object.values(DRAW_MODES),
      default: DRAW_MODES.RANDOM,
      index: true,
    },
    drawAt: { type: Date, required: true, index: true },
    eligibilityCutoffAt: { type: Date, required: true, index: true },
    prizePoolSnapshotAt: { type: Date, required: true },
    numbersPerDraw: {
      type: Number,
      required: true,
      default: 5,
      min: 1,
      max: 10,
    },
    numberRangeMin: { type: Number, required: true, default: 1, min: 1 },
    numberRangeMax: { type: Number, required: true, default: 45, min: 1 },
    status: {
      type: String,
      enum: Object.values(DRAW_SNAPSHOT_STATUSES),
      default: DRAW_SNAPSHOT_STATUSES.DRAFT,
      index: true,
    },
    entriesGeneratedAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    publishedResultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DrawPublishedResult",
      default: null,
      index: true,
    },
    prizePoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DrawPrizePool",
      default: null,
    },
    totalEligibleUsers: { type: Number, default: 0, min: 0 },
    totalEntries: { type: Number, default: 0, min: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

drawsSchema.index({ year: 1, month: 1 }, { unique: true });
drawsSchema.index({ status: 1, drawAt: 1 });

export const DrawModel =
  mongoose.models.Draw || mongoose.model("Draw", drawsSchema);
