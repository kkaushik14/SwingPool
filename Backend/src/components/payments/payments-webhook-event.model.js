import mongoose from "mongoose";

import { STRIPE_WEBHOOK_EVENT_STATUSES } from "./payments.enums.js";

const paymentsWebhookEventSchema = new mongoose.Schema(
  {
    stripeEventId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    paymentIntentId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    stripeObjectId: {
      type: String,
      default: "",
      trim: true,
    },
    livemode: {
      type: Boolean,
      default: false,
    },
    apiVersion: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(STRIPE_WEBHOOK_EVENT_STATUSES),
      default: STRIPE_WEBHOOK_EVENT_STATUSES.PROCESSING,
      index: true,
    },
    processingAttempts: {
      type: Number,
      default: 1,
      min: 1,
    },
    firstReceivedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastReceivedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    processedAt: {
      type: Date,
      default: null,
      index: true,
    },
    payloadHash: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    processingError: {
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

paymentsWebhookEventSchema.index({ paymentIntentId: 1, createdAt: -1 });
paymentsWebhookEventSchema.index({ eventType: 1, status: 1, createdAt: -1 });

export const PaymentWebhookEventModel =
  mongoose.models.PaymentWebhookEvent ||
  mongoose.model("PaymentWebhookEvent", paymentsWebhookEventSchema);
