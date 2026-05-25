import mongoose from "mongoose";

import {
  SUBSCRIPTION_CURRENCIES,
  SUBSCRIPTION_STATUSES,
} from "./subscriptions.enums.js";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
      index: true,
    },
    planCode: {
      type: String,
      required: true,
      index: true,
    },
    planNameSnapshot: {
      type: String,
      required: true,
    },
    planPriceInrSnapshot: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: Object.values(SUBSCRIPTION_CURRENCIES),
      default: SUBSCRIPTION_CURRENCIES.INR,
    },
    status: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUSES),
      default: SUBSCRIPTION_STATUSES.PENDING_PAYMENT,
      index: true,
    },
    startAt: {
      type: Date,
      default: null,
    },
    endAt: {
      type: Date,
      default: null,
    },
    nextBillingAt: {
      type: Date,
      default: null,
    },
    gracePeriodEndsAt: {
      type: Date,
      default: null,
      index: true,
    },
    canceledAt: {
      type: Date,
      default: null,
    },
    charityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Charity",
      default: null,
    },
    mandatoryCharityPercentageSnapshot: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    charityContributionInr: {
      type: Number,
      default: 0,
      min: 0,
    },
    latestCouponCode: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },
    lastPaymentIntentId: {
      type: String,
      default: "",
      index: true,
    },
    lastPaymentStatus: {
      type: String,
      default: "pending",
      index: true,
    },
    autoRenew: {
      type: Boolean,
      default: true,
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

subscriptionSchema.index({ userId: 1, status: 1, createdAt: -1 });
subscriptionSchema.index({ status: 1, autoRenew: 1, nextBillingAt: 1 });
subscriptionSchema.index({ status: 1, gracePeriodEndsAt: 1 });

export const SubscriptionModel =
  mongoose.models.Subscription ||
  mongoose.model("Subscription", subscriptionSchema);
