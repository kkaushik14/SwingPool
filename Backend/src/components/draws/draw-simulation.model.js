import mongoose from "mongoose";

import { DRAW_MODES, DRAW_SIMULATION_STATUSES } from "./draws.enums.js";

const drawSimulationSchema = new mongoose.Schema(
  {
    drawId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Draw",
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: Object.values(DRAW_MODES),
      required: true,
      index: true,
    },
    winningNumbers: {
      type: [Number],
      required: true,
      validate: {
        validator: (numbers) => Array.isArray(numbers) && numbers.length > 0,
        message: "winningNumbers must contain at least one number.",
      },
    },
    winnerStats: {
      match3Count: { type: Number, default: 0, min: 0 },
      match4Count: { type: Number, default: 0, min: 0 },
      match5Count: { type: Number, default: 0, min: 0 },
    },
    jackpotWouldRollOver: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: Object.values(DRAW_SIMULATION_STATUSES),
      default: DRAW_SIMULATION_STATUSES.COMPLETED,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    requestedAt: { type: Date, required: true, default: Date.now },
    notes: { type: String, default: "", trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

drawSimulationSchema.index({ drawId: 1, requestedAt: -1 });

export const DrawSimulationModel =
  mongoose.models.DrawSimulation ||
  mongoose.model("DrawSimulation", drawSimulationSchema);
