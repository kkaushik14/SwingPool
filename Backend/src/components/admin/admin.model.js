import mongoose from "mongoose";

import { ADMIN_STATUSES } from "./admin.enums.js";

const adminSchema = new mongoose.Schema(
  {
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: { type: String, required: true, trim: true },
    resourceType: { type: String, required: true, trim: true },
    resourceId: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: Object.values(ADMIN_STATUSES),
      default: ADMIN_STATUSES.ACTIVE,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const AdminModel =
  mongoose.models.Admin || mongoose.model("Admin", adminSchema);
