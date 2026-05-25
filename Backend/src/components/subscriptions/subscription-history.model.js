import mongoose from "mongoose";

import { SUBSCRIPTION_HISTORY_EVENT_TYPES } from "./subscriptions.enums.js";

const subscriptionHistorySchema = new mongoose.Schema(
  {
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: Object.values(SUBSCRIPTION_HISTORY_EVENT_TYPES),
      required: true,
      index: true,
    },
    previousStatus: {
      type: String,
      default: null,
    },
    nextStatus: {
      type: String,
      default: null,
    },
    previousPlanCode: {
      type: String,
      default: null,
    },
    nextPlanCode: {
      type: String,
      default: null,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    occurredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

subscriptionHistorySchema.index({ userId: 1, occurredAt: -1 });

export const SubscriptionHistoryModel =
  mongoose.models.SubscriptionHistory ||
  mongoose.model("SubscriptionHistory", subscriptionHistorySchema);
