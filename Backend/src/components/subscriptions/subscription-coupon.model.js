import mongoose from "mongoose";

import { COUPON_DISCOUNT_TYPES } from "./subscriptions.enums.js";

const subscriptionCouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    discountType: {
      type: String,
      enum: Object.values(COUPON_DISCOUNT_TYPES),
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscountInr: {
      type: Number,
      default: null,
      min: 0,
    },
    minOrderAmountInr: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxRedemptions: {
      type: Number,
      default: null,
      min: 1,
    },
    redeemedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    validFrom: {
      type: Date,
      default: null,
      index: true,
    },
    validTo: {
      type: Date,
      default: null,
      index: true,
    },
    applicablePlanCodes: {
      type: [String],
      default: [],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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

subscriptionCouponSchema.index({ code: 1, isActive: 1 });

export const SubscriptionCouponModel =
  mongoose.models.SubscriptionCoupon ||
  mongoose.model("SubscriptionCoupon", subscriptionCouponSchema);
