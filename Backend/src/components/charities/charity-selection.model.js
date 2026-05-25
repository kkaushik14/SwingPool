import mongoose from "mongoose";

import {
  CHARITY_CURRENCIES,
  CHARITY_SELECTION_STATUSES,
} from "./charities.enums.js";

const charitySelectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    charityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Charity",
      required: true,
      index: true,
    },
    currency: {
      type: String,
      enum: Object.values(CHARITY_CURRENCIES),
      default: CHARITY_CURRENCIES.INR,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(CHARITY_SELECTION_STATUSES),
      default: CHARITY_SELECTION_STATUSES.ACTIVE,
      index: true,
    },
    effectiveFrom: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    effectiveTo: {
      type: Date,
      default: null,
      index: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reason: {
      type: String,
      default: "",
      trim: true,
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

charitySelectionSchema.index({ userId: 1, status: 1, effectiveFrom: -1 });
charitySelectionSchema.index({ userId: 1, createdAt: -1 });

export const CharitySelectionModel =
  mongoose.models.CharitySelection ||
  mongoose.model("CharitySelection", charitySelectionSchema);
