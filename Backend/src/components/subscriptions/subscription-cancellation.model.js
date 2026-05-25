import mongoose from "mongoose";

const subscriptionCancellationSchema = new mongoose.Schema(
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
    canceledAt: {
      type: Date,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      default: "",
      trim: true,
    },
    immediate: {
      type: Boolean,
      default: true,
    },
    statusBeforeCancel: {
      type: String,
      default: null,
    },
    statusAfterCancel: {
      type: String,
      default: "canceled",
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
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

subscriptionCancellationSchema.index({ userId: 1, canceledAt: -1 });

export const SubscriptionCancellationModel =
  mongoose.models.SubscriptionCancellation ||
  mongoose.model("SubscriptionCancellation", subscriptionCancellationSchema);
