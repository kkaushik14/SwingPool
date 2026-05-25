import mongoose from "mongoose";

import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATIONS_STATUSES,
} from "./notifications.enums.js";

const notificationsSchema = new mongoose.Schema(
  {
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
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    channel: {
      type: String,
      enum: Object.values(NOTIFICATION_CHANNELS),
      default: NOTIFICATION_CHANNELS.IN_APP,
    },
    dedupeKey: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    readAt: { type: Date, default: null },
    status: {
      type: String,
      enum: Object.values(NOTIFICATIONS_STATUSES),
      default: NOTIFICATIONS_STATUSES.ACTIVE,
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

notificationsSchema.index({ userId: 1, createdAt: -1 });
notificationsSchema.index(
  { dedupeKey: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      dedupeKey: { $exists: true, $type: "string", $ne: "" },
    },
  },
);

export const NotificationModel =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationsSchema);
