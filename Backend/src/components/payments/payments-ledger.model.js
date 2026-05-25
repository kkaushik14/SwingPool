import mongoose from "mongoose";

import { DEFAULT_CURRENCY } from "../../constants/index.js";

import {
  PAYMENT_LEDGER_DIRECTIONS,
  PAYMENT_LEDGER_ENTRY_TYPES,
} from "./payments.enums.js";

const paymentsLedgerSchema = new mongoose.Schema(
  {
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
    stripePaymentIntentId: {
      type: String,
      default: "",
      trim: true,
      index: true,
      immutable: true,
    },
    stripeEventId: {
      type: String,
      default: "",
      trim: true,
      index: true,
      immutable: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      immutable: true,
      index: true,
    },
    entryType: {
      type: String,
      enum: Object.values(PAYMENT_LEDGER_ENTRY_TYPES),
      required: true,
      immutable: true,
      index: true,
    },
    direction: {
      type: String,
      enum: Object.values(PAYMENT_LEDGER_DIRECTIONS),
      default: PAYMENT_LEDGER_DIRECTIONS.NEUTRAL,
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
    currency: {
      type: String,
      default: DEFAULT_CURRENCY,
      lowercase: true,
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
    "Payment ledger entries are immutable and cannot be modified.",
  );
};

paymentsLedgerSchema.pre("updateOne", immutableMutationError);
paymentsLedgerSchema.pre("updateMany", immutableMutationError);
paymentsLedgerSchema.pre("findOneAndUpdate", immutableMutationError);
paymentsLedgerSchema.pre("deleteOne", immutableMutationError);
paymentsLedgerSchema.pre("deleteMany", immutableMutationError);
paymentsLedgerSchema.pre("findOneAndDelete", immutableMutationError);

paymentsLedgerSchema.index({ paymentId: 1, occurredAt: -1 });
paymentsLedgerSchema.index({ stripePaymentIntentId: 1, occurredAt: -1 });

export const PaymentLedgerModel =
  mongoose.models.PaymentLedger ||
  mongoose.model("PaymentLedger", paymentsLedgerSchema);
