import mongoose from "mongoose";

import {
  CHARITY_CURRENCIES,
  CONTRIBUTION_RULE_STATUSES,
} from "./charities.enums.js";

const contributionRuleSchema = new mongoose.Schema(
  {
    ruleKey: {
      type: String,
      required: true,
      default: "INR",
      uppercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    currency: {
      type: String,
      enum: Object.values(CHARITY_CURRENCIES),
      default: CHARITY_CURRENCIES.INR,
      index: true,
    },
    gatewayFeePercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    prizePoolPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    mandatoryCharityPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: Object.values(CONTRIBUTION_RULE_STATUSES),
      default: CONTRIBUTION_RULE_STATUSES.ACTIVE,
      index: true,
    },
    effectiveFrom: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    updatedBy: {
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

contributionRuleSchema.index({ currency: 1, status: 1, effectiveFrom: -1 });

export const ContributionRuleModel =
  mongoose.models.ContributionRule ||
  mongoose.model("ContributionRule", contributionRuleSchema);
