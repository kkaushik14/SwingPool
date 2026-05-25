import mongoose from "mongoose";

import { WINNER_PROOF_SUBMISSION_STATUSES } from "./winners.enums.js";

const proofFileSchema = new mongoose.Schema(
  {
    fileUrl: { type: String, required: true, trim: true },
    fileName: { type: String, required: true, trim: true },
    fileType: { type: String, default: "", trim: true },
    sizeBytes: { type: Number, default: 0, min: 0 },
  },
  {
    _id: false,
  },
);

const winnerProofSubmissionSchema = new mongoose.Schema(
  {
    winnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Winner",
      required: true,
      index: true,
    },
    drawId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Draw",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    submissionNumber: {
      type: Number,
      required: true,
      min: 1,
      index: true,
    },
    files: {
      type: [proofFileSchema],
      required: true,
      validate: {
        validator: (files) => Array.isArray(files) && files.length > 0,
        message: "At least one proof file is required.",
      },
    },
    status: {
      type: String,
      enum: Object.values(WINNER_PROOF_SUBMISSION_STATUSES),
      default: WINNER_PROOF_SUBMISSION_STATUSES.SUBMITTED,
      index: true,
    },
    submittedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectionReason: {
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

winnerProofSubmissionSchema.index(
  { winnerId: 1, submissionNumber: -1 },
  { unique: true },
);

export const WinnerProofSubmissionModel =
  mongoose.models.WinnerProofSubmission ||
  mongoose.model("WinnerProofSubmission", winnerProofSubmissionSchema);
