import mongoose from "mongoose";
import { DEFAULT_CURRENCY_CODE } from "../../constants/index.js";

import {
  DRAW_JACKPOT_LEDGER_DIRECTIONS,
  DRAW_JACKPOT_LEDGER_ENTRY_TYPES,
} from "./draws.enums.js";

const drawJackpotLedgerSchema = new mongoose.Schema(
  {
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    drawId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Draw",
      default: null,
      index: true,
    },
    appliedDrawId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Draw",
      default: null,
      index: true,
    },
    entryType: {
      type: String,
      enum: Object.values(DRAW_JACKPOT_LEDGER_ENTRY_TYPES),
      required: true,
      index: true,
    },
    direction: {
      type: String,
      enum: Object.values(DRAW_JACKPOT_LEDGER_DIRECTIONS),
      required: true,
    },
    amountMinor: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: DEFAULT_CURRENCY_CODE,
      trim: true,
    },
    occurredAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
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

drawJackpotLedgerSchema.index({ drawId: 1, occurredAt: 1 });
drawJackpotLedgerSchema.index({
  entryType: 1,
  appliedDrawId: 1,
  occurredAt: 1,
});

export const DrawJackpotLedgerModel =
  mongoose.models.DrawJackpotLedger ||
  mongoose.model("DrawJackpotLedger", drawJackpotLedgerSchema);
