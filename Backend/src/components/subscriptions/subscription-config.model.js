import mongoose from "mongoose";

import { SUBSCRIPTION_CURRENCIES } from "./subscriptions.enums.js";

const subscriptionConfigSchema = new mongoose.Schema(
  {
    configKey: {
      type: String,
      required: true,
      unique: true,
      default: "default",
      index: true,
    },
    gracePeriodDays: {
      type: Number,
      required: true,
      min: 1,
    },
    mandatoryCharityPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    currency: {
      type: String,
      enum: Object.values(SUBSCRIPTION_CURRENCIES),
      default: SUBSCRIPTION_CURRENCIES.INR,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
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

export const SubscriptionConfigModel =
  mongoose.models.SubscriptionConfig ||
  mongoose.model("SubscriptionConfig", subscriptionConfigSchema);
