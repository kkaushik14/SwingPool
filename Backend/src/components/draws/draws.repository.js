import { DrawModel } from "./draws.model.js";
import { DrawConfigModel } from "./draw-config.model.js";
import { DrawEntryModel } from "./draw-entry.model.js";
import { DrawJackpotLedgerModel } from "./draw-jackpot-ledger.model.js";
import { DrawPrizePoolModel } from "./draw-prize-pool.model.js";
import { DrawPublishedResultModel } from "./draw-published-result.model.js";
import { DrawSimulationModel } from "./draw-simulation.model.js";
import { DRAW_JACKPOT_LEDGER_ENTRY_TYPES } from "./draws.enums.js";

import { CharityAllocationLedgerModel } from "../charities/charity-allocation-ledger.model.js";
import { ScoreModel } from "../scores/scores.model.js";
import { SCORES_STATUSES } from "../scores/scores.enums.js";
import { SubscriptionModel } from "../subscriptions/subscriptions.model.js";
import { SUBSCRIPTION_STATUSES } from "../subscriptions/subscriptions.enums.js";
import { DRAW_SNAPSHOT_STATUSES } from "./draws.enums.js";

export const drawsRepository = {
  async getConfig() {
    return DrawConfigModel.findOne({ configKey: "default" });
  },

  async upsertConfig(updatePayload) {
    return DrawConfigModel.findOneAndUpdate(
      { configKey: "default" },
      updatePayload,
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
  },

  async create(payload) {
    return DrawModel.create(payload);
  },

  async findByMonthKey(drawMonthKey) {
    return DrawModel.findOne({ drawMonthKey });
  },

  async findById(id) {
    return DrawModel.findById(id);
  },

  async findMany(filter = {}) {
    return DrawModel.find(filter).sort({ year: -1, month: -1, createdAt: -1 });
  },

  async findDueUnpublishedDraws(at = new Date()) {
    return DrawModel.find({
      status: {
        $in: [
          DRAW_SNAPSHOT_STATUSES.DRAFT,
          DRAW_SNAPSHOT_STATUSES.ENTRIES_LOCKED,
        ],
      },
      drawAt: {
        $lte: at,
      },
    }).sort({ drawAt: 1, createdAt: 1 });
  },

  async updateById(id, updatePayload) {
    return DrawModel.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });
  },

  async createEntry(payload) {
    return DrawEntryModel.create(payload);
  },

  async findEntryByDrawAndUser(drawId, userId) {
    return DrawEntryModel.findOne({ drawId, userId });
  },

  async listEntriesByDraw(drawId) {
    return DrawEntryModel.find({ drawId }).sort({ createdAt: 1 });
  },

  async countEntriesByDraw(drawId) {
    return DrawEntryModel.countDocuments({ drawId });
  },

  async createSimulation(payload) {
    return DrawSimulationModel.create(payload);
  },

  async listSimulationsByDraw(drawId) {
    return DrawSimulationModel.find({ drawId }).sort({
      requestedAt: -1,
      createdAt: -1,
    });
  },

  async createPublishedResult(payload) {
    return DrawPublishedResultModel.create(payload);
  },

  async findPublishedResultByDrawId(drawId) {
    return DrawPublishedResultModel.findOne({ drawId });
  },

  async createPrizePool(payload) {
    return DrawPrizePoolModel.create(payload);
  },

  async findPrizePoolByDrawId(drawId) {
    return DrawPrizePoolModel.findOne({ drawId });
  },

  async findLatestPrizePoolBeforeDate(atDate) {
    return DrawPrizePoolModel.findOne({
      createdAt: { $lt: atDate },
    }).sort({ createdAt: -1 });
  },

  async createJackpotLedgerEntry(payload) {
    return DrawJackpotLedgerModel.create(payload);
  },

  async findJackpotLedgerEntryByIdempotencyKey(idempotencyKey) {
    return DrawJackpotLedgerModel.findOne({ idempotencyKey });
  },

  async listJackpotLedger(filter = {}) {
    return DrawJackpotLedgerModel.find(filter).sort({
      occurredAt: -1,
      createdAt: -1,
    });
  },

  async sumUnappliedManualJackpotCredits() {
    const result = await DrawJackpotLedgerModel.aggregate([
      {
        $match: {
          entryType: DRAW_JACKPOT_LEDGER_ENTRY_TYPES.MANUAL_FUND,
          appliedDrawId: null,
        },
      },
      {
        $group: {
          _id: null,
          totalMinor: { $sum: "$amountMinor" },
        },
      },
    ]);

    return Number(result[0]?.totalMinor || 0);
  },

  async markManualJackpotCreditsApplied(drawId) {
    return DrawJackpotLedgerModel.updateMany(
      {
        entryType: DRAW_JACKPOT_LEDGER_ENTRY_TYPES.MANUAL_FUND,
        appliedDrawId: null,
      },
      {
        $set: {
          appliedDrawId: drawId,
        },
      },
    );
  },

  async findSubscriptionCandidatesForDraw({ cutoffAt, drawAt }) {
    return SubscriptionModel.find({
      status: SUBSCRIPTION_STATUSES.ACTIVE,
      startAt: { $ne: null, $lte: cutoffAt },
      $and: [
        { $or: [{ canceledAt: null }, { canceledAt: { $gt: drawAt } }] },
        { $or: [{ endAt: null }, { endAt: { $gt: drawAt } }] },
      ],
    }).sort({ userId: 1, createdAt: -1 });
  },

  async listQualifyingScoresForUser(userId, limit = 5) {
    return ScoreModel.find({
      userId,
      status: SCORES_STATUSES.ACTIVE,
      isBackdated: false,
    })
      .sort({ submittedAt: -1, createdAt: -1 })
      .limit(limit);
  },

  async aggregateMonthlyPrizePoolMinor({ monthStart, snapshotAt }) {
    const result = await CharityAllocationLedgerModel.aggregate([
      {
        $match: {
          entryType: "prize_pool",
          occurredAt: {
            $gte: monthStart,
            $lte: snapshotAt,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalMinor: { $sum: "$amountMinor" },
        },
      },
    ]);

    return Number(result[0]?.totalMinor || 0);
  },
};
