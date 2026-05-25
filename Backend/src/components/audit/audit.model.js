import mongoose from "mongoose";

import { AUDIT_EVENT_STATUSES } from "./audit.enums.js";

const auditEventSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    actorRole: {
      type: String,
      default: null,
      index: true,
    },
    entity: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    entityId: {
      type: String,
      default: null,
      trim: true,
    },
    requestId: {
      type: String,
      default: null,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: Object.values(AUDIT_EVENT_STATUSES),
      default: AUDIT_EVENT_STATUSES.RECORDED,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

auditEventSchema.index({ createdAt: -1, action: 1 });

export const AuditEventModel =
  mongoose.models.AuditEvent || mongoose.model("AuditEvent", auditEventSchema);
