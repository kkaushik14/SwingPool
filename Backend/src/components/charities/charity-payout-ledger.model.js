import mongoose from "mongoose";

import {
  CHARITY_CURRENCIES,
  CHARITY_PAYOUT_ENTRY_TYPES,
  CHARITY_PAYOUT_STATUSES,
} from "./charities.enums.js";

const charityPayoutLedgerSchema = new mongoose.Schema(
  {
    charityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Charity",
      required: true,
      index: true,
    },
    entryType: {
      type: String,
      enum: Object.values(CHARITY_PAYOUT_ENTRY_TYPES),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(CHARITY_PAYOUT_STATUSES),
      default: CHARITY_PAYOUT_STATUSES.PENDING,
      index: true,
    },
    currency: {
      type: String,
      enum: Object.values(CHARITY_CURRENCIES),
      default: CHARITY_CURRENCIES.INR,
    },
    amountMinor: {
      type: Number,
      required: true,
      min: 0,
    },
    amountMajor: {
      type: String,
      required: true,
      trim: true,
    },
    externalReference: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
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

charityPayoutLedgerSchema.index({ charityId: 1, status: 1, createdAt: -1 });

export const CharityPayoutLedgerModel =
  mongoose.models.CharityPayoutLedger ||
  mongoose.model("CharityPayoutLedger", charityPayoutLedgerSchema);
