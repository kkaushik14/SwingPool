import mongoose from "mongoose";

import {
  PROFILE_COMPLETION_STATUSES,
  PROFILE_VERIFICATION_STATUSES,
} from "../../enums/index.js";

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    firstName: {
      type: String,
      trim: true,
      default: "",
    },
    lastName: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    handicapIndex: {
      type: Number,
      default: 0,
      min: 0,
      max: 54,
    },
    addressLine1: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
    postalCode: {
      type: String,
      trim: true,
      default: "",
    },
    country: {
      type: String,
      trim: true,
      default: "",
    },
    completionStatus: {
      type: String,
      enum: Object.values(PROFILE_COMPLETION_STATUSES),
      default: PROFILE_COMPLETION_STATUSES.INCOMPLETE,
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: Object.values(PROFILE_VERIFICATION_STATUSES),
      default: PROFILE_VERIFICATION_STATUSES.PENDING_VERIFICATION,
      index: true,
    },
    verificationReason: {
      type: String,
      default: "",
      trim: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userProfileSchema.index({ completionStatus: 1, verificationStatus: 1 });

export const UserProfileModel =
  mongoose.models.UserProfile ||
  mongoose.model("UserProfile", userProfileSchema);
