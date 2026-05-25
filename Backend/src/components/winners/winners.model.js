import mongoose from "mongoose";

import { WINNER_PAYOUT_STATUSES } from "./winners.enums.js";

const winnersSchema = new mongoose.Schema(
  {
    drawId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Draw",
      required: true,
      index: true,
    },
    publishedResultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DrawPublishedResult",
      required: true,
      index: true,
    },
    entryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DrawEntry",
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    matchCount: {
      type: Number,
      required: true,
      enum: [3, 4, 5],
      index: true,
    },
    contestNumbers: {
      type: [Number],
      default: [],
    },
    matchedNumbers: {
      type: [Number],
      default: [],
    },
    prizeAmountMinor: {
      type: Number,
      required: true,
      min: 0,
    },
    prizeAmountMajor: {
      type: String,
      required: true,
      trim: true,
    },
    payoutStatus: {
      type: String,
      enum: Object.values(WINNER_PAYOUT_STATUSES),
      default: WINNER_PAYOUT_STATUSES.PENDING_VERIFICATION,
      index: true,
    },
    verificationDeadlineAt: {
      type: Date,
      required: true,
      index: true,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
    payoutPendingAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    payoutReference: {
      type: String,
      default: "",
      trim: true,
    },
    latestProofSubmissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WinnerProofSubmission",
      default: null,
    },
    proofSubmissionCount: {
      type: Number,
      default: 0,
      min: 0,
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

winnersSchema.index({ drawId: 1, matchCount: -1, createdAt: -1 });
winnersSchema.index({ userId: 1, createdAt: -1 });
winnersSchema.index({ payoutStatus: 1, verificationDeadlineAt: 1 });

export const WinnerModel =
  mongoose.models.Winner || mongoose.model("Winner", winnersSchema);
