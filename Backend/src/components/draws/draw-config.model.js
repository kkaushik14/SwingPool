import mongoose from "mongoose";

import { DRAW_DEFAULT_CONFIG, DRAW_MODES } from "./draws.enums.js";

const drawConfigSchema = new mongoose.Schema(
  {
    configKey: {
      type: String,
      required: true,
      default: "default",
      unique: true,
      index: true,
      trim: true,
    },
    mode: {
      type: String,
      enum: Object.values(DRAW_MODES),
      default: DRAW_DEFAULT_CONFIG.MODE,
      index: true,
    },
    numberRangeMin: {
      type: Number,
      required: true,
      default: DRAW_DEFAULT_CONFIG.NUMBER_RANGE_MIN,
      min: 1,
    },
    numberRangeMax: {
      type: Number,
      required: true,
      default: DRAW_DEFAULT_CONFIG.NUMBER_RANGE_MAX,
      min: 1,
    },
    numbersPerDraw: {
      type: Number,
      required: true,
      default: DRAW_DEFAULT_CONFIG.NUMBERS_PER_DRAW,
      min: 1,
      max: 10,
    },
    eligibilityCutoffDaysBeforeMonthEnd: {
      type: Number,
      required: true,
      default: DRAW_DEFAULT_CONFIG.ELIGIBILITY_CUTOFF_DAYS_BEFORE_MONTH_END,
      min: 1,
      max: 15,
    },
    proofDeadlineDays: {
      type: Number,
      required: true,
      default: DRAW_DEFAULT_CONFIG.PROOF_DEADLINE_DAYS,
      min: 1,
      max: 60,
    },
    maxProofFiles: {
      type: Number,
      required: true,
      default: DRAW_DEFAULT_CONFIG.MAX_PROOF_FILES,
      min: 1,
      max: 5,
    },
    prizeDistribution: {
      match3Percentage: {
        type: Number,
        required: true,
        default: DRAW_DEFAULT_CONFIG.PRIZE_DISTRIBUTION.match3Percentage,
        min: 0,
        max: 100,
      },
      match4Percentage: {
        type: Number,
        required: true,
        default: DRAW_DEFAULT_CONFIG.PRIZE_DISTRIBUTION.match4Percentage,
        min: 0,
        max: 100,
      },
      match5Percentage: {
        type: Number,
        required: true,
        default: DRAW_DEFAULT_CONFIG.PRIZE_DISTRIBUTION.match5Percentage,
        min: 0,
        max: 100,
      },
    },
    algorithmOptions: { type: mongoose.Schema.Types.Mixed, default: {} },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const DrawConfigModel =
  mongoose.models.DrawConfig || mongoose.model("DrawConfig", drawConfigSchema);
