import mongoose from "mongoose";

import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_DELIVERY_STATUSES,
  NOTIFICATION_EVENT_TYPES,
} from "./notifications.enums.js";

const notificationDeliverySchema = new mongoose.Schema(
  {
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification",
      default: null,
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
      enum: Object.values(NOTIFICATION_EVENT_TYPES),
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: [
        NOTIFICATION_CHANNELS.IN_APP,
        NOTIFICATION_CHANNELS.EMAIL,
        NOTIFICATION_CHANNELS.SMS,
      ],
      required: true,
      index: true,
    },
    provider: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(NOTIFICATION_DELIVERY_STATUSES),
      default: NOTIFICATION_DELIVERY_STATUSES.QUEUED,
      index: true,
    },
    recipient: {
      type: String,
      default: "",
      trim: true,
    },
    subject: {
      type: String,
      default: "",
      trim: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    dedupeKey: {
      type: String,
      required: true,
      trim: true,
      index: true,
      unique: true,
    },
    providerMessageId: {
      type: String,
      default: "",
      trim: true,
    },
    attemptCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    lastAttemptAt: {
      type: Date,
      default: Date.now,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    errorMessage: {
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

notificationDeliverySchema.index({ userId: 1, createdAt: -1 });
notificationDeliverySchema.index({ eventType: 1, channel: 1, createdAt: -1 });

export const NotificationDeliveryModel =
  mongoose.models.NotificationDelivery ||
  mongoose.model("NotificationDelivery", notificationDeliverySchema);
