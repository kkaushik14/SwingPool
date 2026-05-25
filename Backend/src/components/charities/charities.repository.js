import { CharityAllocationLedgerModel } from "./charity-allocation-ledger.model.js";
import { CharityDonationModel } from "./charity-donation.model.js";
import { CharityPayoutLedgerModel } from "./charity-payout-ledger.model.js";
import { CharitySelectionModel } from "./charity-selection.model.js";
import { CharityModel } from "./charities.model.js";
import { ContributionRuleModel } from "./contribution-rule.model.js";

export const charitiesRepository = {
  async create(payload) {
    return CharityModel.create(payload);
  },

  async findById(id) {
    return CharityModel.findById(id);
  },

  async findByCode(code) {
    return CharityModel.findOne({ code: String(code).trim().toLowerCase() });
  },

  async findMany(filter = {}) {
    return CharityModel.find(filter).sort({ isFeatured: -1, createdAt: -1 });
  },

  async updateById(id, updatePayload) {
    return CharityModel.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });
  },

  async getActiveSelectionByUserId(userId) {
    return CharitySelectionModel.findOne({
      userId,
      status: "active",
      effectiveTo: null,
    }).sort({ effectiveFrom: -1, createdAt: -1 });
  },

  async listSelectionHistoryByUserId(userId) {
    return CharitySelectionModel.find({ userId }).sort({
      effectiveFrom: -1,
      createdAt: -1,
    });
  },

  async createSelection(payload) {
    return CharitySelectionModel.create(payload);
  },

  async supersedeActiveSelection(userId, endedAt = new Date()) {
    return CharitySelectionModel.updateMany(
      {
        userId,
        status: "active",
        effectiveTo: null,
      },
      {
        $set: {
          status: "superseded",
          effectiveTo: endedAt,
        },
      },
    );
  },

  async getContributionRule(ruleKey = "INR") {
    return ContributionRuleModel.findOne({
      ruleKey: String(ruleKey).toUpperCase(),
    });
  },

  async upsertContributionRule(ruleKey = "INR", payload = {}) {
    return ContributionRuleModel.findOneAndUpdate(
      {
        ruleKey: String(ruleKey).toUpperCase(),
      },
      payload,
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
  },

  async createDonation(payload) {
    return CharityDonationModel.create(payload);
  },

  async findDonationById(donationId) {
    return CharityDonationModel.findById(donationId);
  },

  async findDonationByPaymentIntentId(paymentIntentId) {
    return CharityDonationModel.findOne({ paymentIntentId });
  },

  async findDonationByPaymentId(paymentId) {
    return CharityDonationModel.findOne({ paymentId });
  },

  async updateDonationById(donationId, updatePayload) {
    return CharityDonationModel.findByIdAndUpdate(donationId, updatePayload, {
      new: true,
      runValidators: true,
    });
  },

  async listDonationsByUserId(userId) {
    return CharityDonationModel.find({ userId }).sort({ createdAt: -1 });
  },

  async createAllocationLedgerEntry(payload) {
    return CharityAllocationLedgerModel.create(payload);
  },

  async findAllocationLedgerByIdempotencyKey(idempotencyKey) {
    return CharityAllocationLedgerModel.findOne({ idempotencyKey });
  },

  async listAllocationEntriesByPaymentId(paymentId) {
    return CharityAllocationLedgerModel.find({ paymentId }).sort({
      occurredAt: 1,
      createdAt: 1,
    });
  },

  async aggregateAllocationsByCharity({ from, to } = {}) {
    const match = {};

    if (from || to) {
      match.occurredAt = {};

      if (from) {
        match.occurredAt.$gte = from;
      }

      if (to) {
        match.occurredAt.$lte = to;
      }
    }

    return CharityAllocationLedgerModel.aggregate([
      {
        $match: match,
      },
      {
        $group: {
          _id: {
            charityId: "$charityId",
            entryType: "$entryType",
            currency: "$currency",
          },
          amountMinor: {
            $sum: "$amountMinor",
          },
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          "_id.charityId": 1,
          "_id.entryType": 1,
        },
      },
    ]);
  },

  async createPayoutLedgerEntry(payload) {
    return CharityPayoutLedgerModel.create(payload);
  },

  async updatePayoutLedgerEntryById(payoutId, updatePayload) {
    return CharityPayoutLedgerModel.findByIdAndUpdate(payoutId, updatePayload, {
      new: true,
      runValidators: true,
    });
  },

  async findPayoutLedgerEntryById(payoutId) {
    return CharityPayoutLedgerModel.findById(payoutId);
  },

  async listPayoutLedgerEntries(filter = {}) {
    return CharityPayoutLedgerModel.find(filter).sort({ createdAt: -1 });
  },

  async aggregatePayoutsByCharity({ from, to } = {}) {
    const match = {};

    if (from || to) {
      match.createdAt = {};

      if (from) {
        match.createdAt.$gte = from;
      }

      if (to) {
        match.createdAt.$lte = to;
      }
    }

    return CharityPayoutLedgerModel.aggregate([
      {
        $match: match,
      },
      {
        $group: {
          _id: {
            charityId: "$charityId",
            entryType: "$entryType",
            status: "$status",
            currency: "$currency",
          },
          amountMinor: {
            $sum: "$amountMinor",
          },
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          "_id.charityId": 1,
          "_id.entryType": 1,
          "_id.status": 1,
        },
      },
    ]);
  },
};
