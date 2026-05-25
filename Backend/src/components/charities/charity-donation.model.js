import mongoose from "mongoose";

import {
  CHARITY_CURRENCIES,
  DONATION_SOURCES,
  DONATION_STATUSES,
} from "./charities.enums.js";

const charityDonationSchema = new mongoose.Schema(
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
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      index: true,
    },
    paymentIntentId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
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
      enum: Object.values(DONATION_SOURCES),
      required: true,
      index: true,
    },
    currency: {
      type: String,
      enum: Object.values(CHARITY_CURRENCIES),
      default: CHARITY_CURRENCIES.INR,
      index: true,
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
    status: {
      type: String,
      enum: Object.values(DONATION_STATUSES),
      default: DONATION_STATUSES.PROCESSING,
      index: true,
    },
    finalizedAt: {
      type: Date,
      default: null,
      index: true,
    },
    userMessage: {
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

charityDonationSchema.index({ userId: 1, createdAt: -1 });
charityDonationSchema.index({ charityId: 1, status: 1, createdAt: -1 });

export const CharityDonationModel =
  mongoose.models.CharityDonation ||
  mongoose.model("CharityDonation", charityDonationSchema);
