import mongoose from "mongoose";

import { DEFAULT_CURRENCY } from "../../constants/index.js";
import { PAYMENT_STATES } from "./payments.enums.js";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    amountMajor: {
      type: String,
      required: true,
      trim: true,
    },
    currency: {
      type: String,
      default: DEFAULT_CURRENCY,
      lowercase: true,
    },
    description: {
      type: String,
      default: "",
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    stripeCheckoutSessionId: {
      type: String,
      default: null,
      index: true,
    },
    stripeClientSecret: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      enum: Object.values(PAYMENT_STATES),
      default: PAYMENT_STATES.PROCESSING,
      index: true,
    },
    stateReason: {
      type: String,
      default: "",
      trim: true,
    },
    sourceDomain: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    sourceEntityId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    sourceAction: {
      type: String,
      default: "",
      trim: true,
    },
    attemptCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    timeoutAt: {
      type: Date,
      default: null,
      index: true,
    },
    finalizedAt: {
      type: Date,
      default: null,
      index: true,
    },
    stripeLastEventId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    stripeLastEventType: {
      type: String,
      default: "",
      trim: true,
    },
    stripeLastEventAt: {
      type: Date,
      default: null,
    },
    mismatchDetected: {
      type: Boolean,
      default: false,
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

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ state: 1, timeoutAt: 1 });
paymentSchema.index({ state: 1, updatedAt: 1 });
paymentSchema.index({ sourceDomain: 1, sourceEntityId: 1 });

export const PaymentModel =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
