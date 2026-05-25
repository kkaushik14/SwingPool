import { CharityAllocationLedgerModel } from "../charities/charity-allocation-ledger.model.js";
import { CharityDonationModel } from "../charities/charity-donation.model.js";
import { CharityPayoutLedgerModel } from "../charities/charity-payout-ledger.model.js";
import { DrawEntryModel } from "../draws/draw-entry.model.js";
import { DrawPrizePoolModel } from "../draws/draw-prize-pool.model.js";
import { DrawModel } from "../draws/draws.model.js";
import { PaymentModel } from "../payments/payments.model.js";
import { SubscriptionCancellationModel } from "../subscriptions/subscription-cancellation.model.js";
import { SubscriptionModel } from "../subscriptions/subscriptions.model.js";
import { UserProfileModel } from "../users/users-profile.model.js";
import { UserModel } from "../users/users.model.js";
import { WinnerModel } from "../winners/winners.model.js";

export const reportsRepository = {
  async listUsers({
    filter = {},
    sort = { createdAt: -1 },
    skip = 0,
    limit = 20,
  } = {}) {
    return UserModel.find(filter).sort(sort).skip(skip).limit(limit);
  },

  async countUsers(filter = {}) {
    return UserModel.countDocuments(filter);
  },

  async listProfilesByUserIds(userIds = []) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return [];
    }

    return UserProfileModel.find({ userId: { $in: userIds } });
  },

  async findUserIdsByVerificationStatus(verificationStatus) {
    if (!verificationStatus) {
      return [];
    }

    const records = await UserProfileModel.find(
      { verificationStatus },
      { userId: 1 },
    );

    return records.map((item) => item.userId);
  },

  async aggregateUserStatusCounts(filter = {}) {
    return UserModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
  },

  async aggregateProfileVerificationCounts(filter = {}) {
    return UserProfileModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$verificationStatus",
          count: { $sum: 1 },
        },
      },
    ]);
  },

  async listSubscriptions({
    filter = {},
    sort = { createdAt: -1 },
    skip = 0,
    limit = 20,
  } = {}) {
    return SubscriptionModel.find(filter).sort(sort).skip(skip).limit(limit);
  },

  async countSubscriptions(filter = {}) {
    return SubscriptionModel.countDocuments(filter);
  },

  async aggregateSubscriptionStatusCounts(filter = {}) {
    return SubscriptionModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
  },

  async aggregateSubscriptionPlanMix(filter = {}) {
    return SubscriptionModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$planCode",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);
  },

  async countSubscriptionChurn({ from = null, to = null } = {}) {
    const filter = {};

    if (from || to) {
      filter.canceledAt = {};

      if (from) {
        filter.canceledAt.$gte = from;
      }

      if (to) {
        filter.canceledAt.$lte = to;
      }
    }

    return SubscriptionCancellationModel.countDocuments(filter);
  },

  async listPayments({
    filter = {},
    sort = { createdAt: -1 },
    skip = 0,
    limit = 20,
  } = {}) {
    return PaymentModel.find(filter).sort(sort).skip(skip).limit(limit);
  },

  async countPayments(filter = {}) {
    return PaymentModel.countDocuments(filter);
  },

  async aggregatePaymentOutcomes(filter = {}) {
    return PaymentModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$state",
          count: { $sum: 1 },
          totalAmountMinor: { $sum: "$amount" },
        },
      },
    ]);
  },

  async aggregateCharityAllocations({
    from = null,
    to = null,
    charityId = null,
  } = {}) {
    const match = {};

    if (charityId) {
      match.charityId = charityId;
    }

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
      { $match: match },
      {
        $group: {
          _id: "$entryType",
          totalAmountMinor: { $sum: "$amountMinor" },
          count: { $sum: 1 },
        },
      },
    ]);
  },

  async aggregateDonations({ from = null, to = null, charityId = null } = {}) {
    const match = {};

    if (charityId) {
      match.charityId = charityId;
    }

    if (from || to) {
      match.createdAt = {};

      if (from) {
        match.createdAt.$gte = from;
      }

      if (to) {
        match.createdAt.$lte = to;
      }
    }

    return CharityDonationModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmountMinor: { $sum: "$amountMinor" },
        },
      },
    ]);
  },

  async aggregatePayouts({ from = null, to = null, charityId = null } = {}) {
    const match = {};

    if (charityId) {
      match.charityId = charityId;
    }

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
      { $match: match },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmountMinor: { $sum: "$amountMinor" },
        },
      },
    ]);
  },

  async listDraws({
    filter = {},
    sort = { year: -1, month: -1 },
    skip = 0,
    limit = 20,
  } = {}) {
    return DrawModel.find(filter).sort(sort).skip(skip).limit(limit);
  },

  async countDraws(filter = {}) {
    return DrawModel.countDocuments(filter);
  },

  async aggregateDrawStatusCounts(filter = {}) {
    return DrawModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
  },

  async countDrawEntriesByDrawIds(drawIds = []) {
    if (!Array.isArray(drawIds) || drawIds.length === 0) {
      return [];
    }

    return DrawEntryModel.aggregate([
      {
        $match: {
          drawId: { $in: drawIds },
        },
      },
      {
        $group: {
          _id: "$drawId",
          count: { $sum: 1 },
        },
      },
    ]);
  },

  async listPrizePools({
    filter = {},
    sort = { createdAt: -1 },
    skip = 0,
    limit = 20,
  } = {}) {
    return DrawPrizePoolModel.find(filter).sort(sort).skip(skip).limit(limit);
  },

  async listPrizePoolsByDrawIds(drawIds = []) {
    if (!Array.isArray(drawIds) || drawIds.length === 0) {
      return [];
    }

    return DrawPrizePoolModel.find({ drawId: { $in: drawIds } });
  },

  async countPrizePools(filter = {}) {
    return DrawPrizePoolModel.countDocuments(filter);
  },

  async aggregatePrizePoolSummary(filter = {}) {
    return DrawPrizePoolModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          subscriptionPrizePoolMinor: { $sum: "$subscriptionPrizePoolMinor" },
          manualJackpotAddedMinor: { $sum: "$manualJackpotAddedMinor" },
          jackpotCarryInMinor: { $sum: "$jackpotCarryInMinor" },
          jackpotCarryOutMinor: { $sum: "$jackpotCarryOutMinor" },
          companyRevenueMinor: { $sum: "$companyRevenueMinor" },
          match3PaidMinor: { $sum: "$match3PaidMinor" },
          match4PaidMinor: { $sum: "$match4PaidMinor" },
          match5PaidMinor: { $sum: "$match5PaidMinor" },
        },
      },
    ]);
  },

  async listWinners({
    filter = {},
    sort = { createdAt: -1 },
    skip = 0,
    limit = 20,
  } = {}) {
    return WinnerModel.find(filter).sort(sort).skip(skip).limit(limit);
  },

  async countWinners(filter = {}) {
    return WinnerModel.countDocuments(filter);
  },

  async aggregateWinnerPayoutStates(filter = {}) {
    return WinnerModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$payoutStatus",
          count: { $sum: 1 },
          totalPrizeMinor: { $sum: "$prizeAmountMinor" },
        },
      },
    ]);
  },

  async aggregateWinnerMatchCounts(filter = {}) {
    return WinnerModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$matchCount",
          count: { $sum: 1 },
          totalPrizeMinor: { $sum: "$prizeAmountMinor" },
        },
      },
    ]);
  },
};
