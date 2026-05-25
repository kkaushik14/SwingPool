import { AuditEventModel } from "../audit/audit.model.js";
import { CharityDonationModel } from "../charities/charity-donation.model.js";
import { CharityPayoutLedgerModel } from "../charities/charity-payout-ledger.model.js";
import { CharityModel } from "../charities/charities.model.js";
import { DrawEntryModel } from "../draws/draw-entry.model.js";
import { DrawPrizePoolModel } from "../draws/draw-prize-pool.model.js";
import { DrawSimulationModel } from "../draws/draw-simulation.model.js";
import { DrawModel } from "../draws/draws.model.js";
import { PaymentLedgerModel } from "../payments/payments-ledger.model.js";
import { PaymentModel } from "../payments/payments.model.js";
import { ScoreModel } from "../scores/scores.model.js";
import { SubscriptionCouponModel } from "../subscriptions/subscription-coupon.model.js";
import { SubscriptionHistoryModel } from "../subscriptions/subscription-history.model.js";
import { SubscriptionPlanModel } from "../subscriptions/subscription-plan.model.js";
import { SubscriptionConfigModel } from "../subscriptions/subscription-config.model.js";
import { SubscriptionModel } from "../subscriptions/subscriptions.model.js";
import { UserProfileModel } from "../users/users-profile.model.js";
import { UserModel } from "../users/users.model.js";
import { WinnerProofSubmissionModel } from "../winners/winner-proof-submission.model.js";
import { WinnerModel } from "../winners/winners.model.js";

export const adminRepository = {
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

  async findUserById(userId) {
    return UserModel.findById(userId);
  },

  async findUserProfileByUserId(userId) {
    return UserProfileModel.findOne({ userId });
  },

  async listPlans({
    filter = {},
    sort = { hierarchyLevel: 1, createdAt: 1 },
  } = {}) {
    return SubscriptionPlanModel.find(filter).sort(sort);
  },

  async findPlanById(planId) {
    return SubscriptionPlanModel.findById(planId);
  },

  async listCoupons({ filter = {}, sort = { createdAt: -1 } } = {}) {
    return SubscriptionCouponModel.find(filter).sort(sort);
  },

  async findCouponById(couponId) {
    return SubscriptionCouponModel.findById(couponId);
  },

  async getSubscriptionConfig() {
    return SubscriptionConfigModel.findOne({ configKey: "default" });
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

  async findSubscriptionById(subscriptionId) {
    return SubscriptionModel.findById(subscriptionId);
  },

  async updateSubscriptionById(subscriptionId, updatePayload) {
    return SubscriptionModel.findByIdAndUpdate(subscriptionId, updatePayload, {
      new: true,
      runValidators: true,
    });
  },

  async createSubscriptionHistory(payload) {
    return SubscriptionHistoryModel.create(payload);
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

  async findPaymentById(paymentId) {
    return PaymentModel.findById(paymentId);
  },

  async updatePaymentById(paymentId, updatePayload) {
    return PaymentModel.findByIdAndUpdate(paymentId, updatePayload, {
      new: true,
      runValidators: true,
    });
  },

  async listPaymentLedgerByPaymentId(paymentId) {
    return PaymentLedgerModel.find({ paymentId }).sort({
      occurredAt: 1,
      createdAt: 1,
    });
  },

  async listCharities({
    filter = {},
    sort = { isFeatured: -1, createdAt: -1 },
    skip = 0,
    limit = 20,
  } = {}) {
    return CharityModel.find(filter).sort(sort).skip(skip).limit(limit);
  },

  async countCharities(filter = {}) {
    return CharityModel.countDocuments(filter);
  },

  async findCharityById(charityId) {
    return CharityModel.findById(charityId);
  },

  async listDonations({
    filter = {},
    sort = { createdAt: -1 },
    skip = 0,
    limit = 20,
  } = {}) {
    return CharityDonationModel.find(filter).sort(sort).skip(skip).limit(limit);
  },

  async countDonations(filter = {}) {
    return CharityDonationModel.countDocuments(filter);
  },

  async findDonationById(donationId) {
    return CharityDonationModel.findById(donationId);
  },

  async updateDonationById(donationId, updatePayload) {
    return CharityDonationModel.findByIdAndUpdate(donationId, updatePayload, {
      new: true,
      runValidators: true,
    });
  },

  async listPayouts({
    filter = {},
    sort = { createdAt: -1 },
    skip = 0,
    limit = 20,
  } = {}) {
    return CharityPayoutLedgerModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
  },

  async countPayouts(filter = {}) {
    return CharityPayoutLedgerModel.countDocuments(filter);
  },

  async findPayoutById(payoutId) {
    return CharityPayoutLedgerModel.findById(payoutId);
  },

  async listScores({
    filter = {},
    sort = { submittedAt: -1, createdAt: -1 },
    skip = 0,
    limit = 20,
  } = {}) {
    return ScoreModel.find(filter).sort(sort).skip(skip).limit(limit);
  },

  async countScores(filter = {}) {
    return ScoreModel.countDocuments(filter);
  },

  async findScoreById(scoreId) {
    return ScoreModel.findById(scoreId);
  },

  async listDraws({
    filter = {},
    sort = { year: -1, month: -1, createdAt: -1 },
    skip = 0,
    limit = 20,
  } = {}) {
    return DrawModel.find(filter).sort(sort).skip(skip).limit(limit);
  },

  async countDraws(filter = {}) {
    return DrawModel.countDocuments(filter);
  },

  async findDrawById(drawId) {
    return DrawModel.findById(drawId);
  },

  async findDrawPrizePoolByDrawId(drawId) {
    return DrawPrizePoolModel.findOne({ drawId });
  },

  async listDrawEntriesByDrawId(drawId) {
    return DrawEntryModel.find({ drawId }).sort({ createdAt: 1 });
  },

  async listDrawSimulationsByDrawId(drawId) {
    return DrawSimulationModel.find({ drawId }).sort({
      requestedAt: -1,
      createdAt: -1,
    });
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

  async findWinnerById(winnerId) {
    return WinnerModel.findById(winnerId);
  },

  async listWinnerProofsByWinnerId(winnerId) {
    return WinnerProofSubmissionModel.find({ winnerId }).sort({
      submissionNumber: -1,
      createdAt: -1,
    });
  },

  async findWinnerProofById(proofId) {
    return WinnerProofSubmissionModel.findById(proofId);
  },

  async listAuditEvents({
    filter = {},
    sort = { createdAt: -1 },
    skip = 0,
    limit = 20,
  } = {}) {
    return AuditEventModel.find(filter).sort(sort).skip(skip).limit(limit);
  },

  async countAuditEvents(filter = {}) {
    return AuditEventModel.countDocuments(filter);
  },
};
