import mongoose from "mongoose";

import { JOB_EXECUTION_STATUSES } from "./jobs.enums.js";

const jobExecutionSchema = new mongoose.Schema(
  {
    jobName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    runKey: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    correlationId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    requestId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(JOB_EXECUTION_STATUSES),
      default: JOB_EXECUTION_STATUSES.RUNNING,
      index: true,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    finishedAt: {
      type: Date,
      default: null,
      index: true,
    },
    durationMs: {
      type: Number,
      default: null,
      min: 0,
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    errorMessage: {
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

jobExecutionSchema.index({ jobName: 1, runKey: 1 }, { unique: true });
jobExecutionSchema.index({ jobName: 1, startedAt: -1 });

export const JobExecutionModel =
  mongoose.models.JobExecution ||
  mongoose.model("JobExecution", jobExecutionSchema);
