import mongoose from "mongoose";

import { DRAW_MODES, DRAW_PUBLISHED_RESULT_STATUSES } from "./draws.enums.js";

const drawPublishedResultSchema = new mongoose.Schema(
  {
    drawId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Draw",
      required: true,
      unique: true,
      index: true,
      immutable: true,
    },
    mode: {
      type: String,
      enum: Object.values(DRAW_MODES),
      required: true,
      immutable: true,
    },
    winningNumbers: {
      type: [Number],
      required: true,
      immutable: true,
      validate: {
        validator: (numbers) => Array.isArray(numbers) && numbers.length > 0,
        message: "winningNumbers must contain at least one number.",
      },
    },
    status: {
      type: String,
      enum: Object.values(DRAW_PUBLISHED_RESULT_STATUSES),
      default: DRAW_PUBLISHED_RESULT_STATUSES.PUBLISHED,
      immutable: true,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      immutable: true,
    },
    publishedAt: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      immutable: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const immutableMutationError = () => {
  throw new Error(
    "Published draw results are immutable and cannot be modified.",
  );
};

drawPublishedResultSchema.pre("updateOne", immutableMutationError);
drawPublishedResultSchema.pre("updateMany", immutableMutationError);
drawPublishedResultSchema.pre("findOneAndUpdate", immutableMutationError);
drawPublishedResultSchema.pre("deleteOne", immutableMutationError);
drawPublishedResultSchema.pre("deleteMany", immutableMutationError);
drawPublishedResultSchema.pre("findOneAndDelete", immutableMutationError);

export const DrawPublishedResultModel =
  mongoose.models.DrawPublishedResult ||
  mongoose.model("DrawPublishedResult", drawPublishedResultSchema);
