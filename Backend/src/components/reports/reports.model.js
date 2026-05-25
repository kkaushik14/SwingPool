import mongoose from "mongoose";

import { REPORT_SCOPES } from "./reports.enums.js";

const reportsSchema = new mongoose.Schema(
  {
    scope: {
      type: String,
      enum: Object.values(REPORT_SCOPES),
      required: true,
      index: true,
    },
    periodStart: {
      type: Date,
      default: null,
    },
    periodEnd: {
      type: Date,
      default: null,
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    summary: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

reportsSchema.index({ scope: 1, createdAt: -1 });

export const ReportModel =
  mongoose.models.Report || mongoose.model("Report", reportsSchema);
