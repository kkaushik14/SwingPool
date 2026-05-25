import mongoose from "mongoose";

import {
  CHARITY_ALLOCATION_DIRECTIONS,
  CHARITY_ALLOCATION_ENTRY_TYPES,
  CHARITY_CURRENCIES,
} from "./charities.enums.js";

const charityAllocationLedgerSchema = new mongoose.Schema(
  {
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
      immutable: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      index: true,
      immutable: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      immutable: true,
    },
    charityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Charity",
      default: null,
      index: true,
      immutable: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
      index: true,
      immutable: true,
    },
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CharityDonation",
      default: null,
      index: true,
      immutable: true,
    },
    entryType: {
      type: String,
      enum: Object.values(CHARITY_ALLOCATION_ENTRY_TYPES),
      required: true,
      index: true,
      immutable: true,
    },
    direction: {
      type: String,
      enum: Object.values(CHARITY_ALLOCATION_DIRECTIONS),
      required: true,
      immutable: true,
    },
    currency: {
      type: String,
      enum: Object.values(CHARITY_CURRENCIES),
      default: CHARITY_CURRENCIES.INR,
      immutable: true,
    },
    amountMinor: {
      type: Number,
      required: true,
      min: 0,
      immutable: true,
    },
    amountMajor: {
      type: String,
      required: true,
      trim: true,
      immutable: true,
    },
    percentageApplied: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
      immutable: true,
    },
    occurredAt: {
      type: Date,
      required: true,
      index: true,
      immutable: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      immutable: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const immutableMutationError = () => {
  throw new Error(
    "Charity allocation ledger entries are immutable and cannot be modified.",
  );
};

charityAllocationLedgerSchema.pre("updateOne", immutableMutationError);
charityAllocationLedgerSchema.pre("updateMany", immutableMutationError);
charityAllocationLedgerSchema.pre("findOneAndUpdate", immutableMutationError);
charityAllocationLedgerSchema.pre("deleteOne", immutableMutationError);
charityAllocationLedgerSchema.pre("deleteMany", immutableMutationError);
charityAllocationLedgerSchema.pre("findOneAndDelete", immutableMutationError);

charityAllocationLedgerSchema.index({ charityId: 1, occurredAt: -1 });
charityAllocationLedgerSchema.index({ entryType: 1, occurredAt: 1 });
charityAllocationLedgerSchema.index({ paymentId: 1, occurredAt: 1 });

export const CharityAllocationLedgerModel =
  mongoose.models.CharityAllocationLedger ||
  mongoose.model("CharityAllocationLedger", charityAllocationLedgerSchema);
