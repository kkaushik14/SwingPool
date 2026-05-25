import mongoose from "mongoose";

import { CHARITIES_STATUSES, CHARITY_CURRENCIES } from "./charities.enums.js";

const charitiesSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    mission: { type: String, required: true, trim: true },
    website: { type: String, default: "", trim: true },
    currency: {
      type: String,
      enum: Object.values(CHARITY_CURRENCIES),
      default: CHARITY_CURRENCIES.INR,
      index: true,
    },
    supportedCurrencies: {
      type: [String],
      default: [CHARITY_CURRENCIES.INR],
    },
    totalRaised: { type: Number, default: 0, min: 0 },
    totalRaisedMajor: { type: String, default: "0.00", trim: true },
    isFeatured: { type: Boolean, default: false },
    status: {
      type: String,
      enum: Object.values(CHARITIES_STATUSES),
      default: CHARITIES_STATUSES.ACTIVE,
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

charitiesSchema.index({ status: 1, isFeatured: -1, createdAt: -1 });

export const CharityModel =
  mongoose.models.Charity || mongoose.model("Charity", charitiesSchema);
