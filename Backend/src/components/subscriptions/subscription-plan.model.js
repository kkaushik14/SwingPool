import mongoose from "mongoose";

import { SUBSCRIPTION_CURRENCIES } from "./subscriptions.enums.js";

const subscriptionPlanSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    priceInr: {
      type: Number,
      required: true,
      min: 0,
    },
    billingCycleDays: {
      type: Number,
      required: true,
      min: 1,
    },
    hierarchyLevel: {
      type: Number,
      required: true,
      min: 1,
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

subscriptionPlanSchema.index({ hierarchyLevel: 1, isActive: 1 });

export const SubscriptionPlanModel =
  mongoose.models.SubscriptionPlan ||
  mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
