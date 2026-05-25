import mongoose from "mongoose";
import { DEFAULT_CURRENCY_CODE } from "../../constants/index.js";

const drawPrizePoolSchema = new mongoose.Schema(
  {
    drawId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Draw",
      required: true,
      unique: true,
      index: true,
    },
    currency: { type: String, default: DEFAULT_CURRENCY_CODE, trim: true },
    snapshotAt: { type: Date, required: true },
    subscriptionPrizePoolMinor: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    manualJackpotAddedMinor: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    jackpotCarryInMinor: { type: Number, required: true, min: 0, default: 0 },
    bucket3Minor: { type: Number, required: true, min: 0, default: 0 },
    bucket4Minor: { type: Number, required: true, min: 0, default: 0 },
    bucket5Minor: { type: Number, required: true, min: 0, default: 0 },
    winners3Count: { type: Number, required: true, min: 0, default: 0 },
    winners4Count: { type: Number, required: true, min: 0, default: 0 },
    winners5Count: { type: Number, required: true, min: 0, default: 0 },
    match3PaidMinor: { type: Number, required: true, min: 0, default: 0 },
    match4PaidMinor: { type: Number, required: true, min: 0, default: 0 },
    match5PaidMinor: { type: Number, required: true, min: 0, default: 0 },
    unused3ToRevenueMinor: { type: Number, required: true, min: 0, default: 0 },
    unused4ToRevenueMinor: { type: Number, required: true, min: 0, default: 0 },
    companyRevenueMinor: { type: Number, required: true, min: 0, default: 0 },
    jackpotCarryOutMinor: { type: Number, required: true, min: 0, default: 0 },
    finalizedAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const DrawPrizePoolModel =
  mongoose.models.DrawPrizePool ||
  mongoose.model("DrawPrizePool", drawPrizePoolSchema);
