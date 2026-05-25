import mongoose from "mongoose";

import { DRAW_ENTRY_SOURCES } from "./draws.enums.js";

const drawEntrySchema = new mongoose.Schema(
  {
    drawId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Draw",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
      index: true,
    },
    source: {
      type: String,
      enum: Object.values(DRAW_ENTRY_SOURCES),
      default: DRAW_ENTRY_SOURCES.AUTOMATIC,
      index: true,
    },
    contestNumbers: {
      type: [Number],
      required: true,
      validate: {
        validator: (numbers) => Array.isArray(numbers) && numbers.length > 0,
        message: "contestNumbers must contain at least one number.",
      },
    },
    qualifyingScoreIds: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    generatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

drawEntrySchema.index({ drawId: 1, userId: 1 }, { unique: true });
drawEntrySchema.index({ drawId: 1, generatedAt: -1 });

export const DrawEntryModel =
  mongoose.models.DrawEntry || mongoose.model("DrawEntry", drawEntrySchema);
