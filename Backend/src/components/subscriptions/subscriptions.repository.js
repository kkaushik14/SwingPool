import { SubscriptionModel } from "./subscriptions.model.js";
import { SubscriptionPlanModel } from "./subscription-plan.model.js";
import { SubscriptionCouponModel } from "./subscription-coupon.model.js";
import { SubscriptionConfigModel } from "./subscription-config.model.js";
import { SubscriptionHistoryModel } from "./subscription-history.model.js";
import { SubscriptionCancellationModel } from "./subscription-cancellation.model.js";
import { SUBSCRIPTION_STATUSES } from "./subscriptions.enums.js";

const ACTIVE_LIKE_STATUSES = [
  SUBSCRIPTION_STATUSES.PENDING_PAYMENT,
  SUBSCRIPTION_STATUSES.ACTIVE,
  SUBSCRIPTION_STATUSES.GRACE_PERIOD,
  SUBSCRIPTION_STATUSES.PAYMENT_FAILED,
];

export const subscriptionsRepository = {
  async listPlans({ includeInactive = false } = {}) {
    const filter = includeInactive ? {} : { isActive: true };
    return SubscriptionPlanModel.find(filter).sort({
      hierarchyLevel: 1,
      createdAt: 1,
    });
  },

  async findPlanByCode(code) {
    return SubscriptionPlanModel.findOne({ code: String(code).toLowerCase() });
  },

  async findPlanById(planId) {
    return SubscriptionPlanModel.findById(planId);
  },

  async createPlan(payload) {
    return SubscriptionPlanModel.create(payload);
  },

  async upsertPlanByCode(code, payload) {
    return SubscriptionPlanModel.findOneAndUpdate(
      { code: String(code).toLowerCase() },
      payload,
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
  },

  async updatePlanById(planId, updatePayload) {
    return SubscriptionPlanModel.findByIdAndUpdate(planId, updatePayload, {
      new: true,
      runValidators: true,
    });
  },

  async listCoupons({ includeInactive = true } = {}) {
    const filter = includeInactive ? {} : { isActive: true };
    return SubscriptionCouponModel.find(filter).sort({ createdAt: -1 });
  },

  async findCouponByCode(code) {
    return SubscriptionCouponModel.findOne({
      code: String(code).toUpperCase(),
    });
  },

  async createCoupon(payload) {
    return SubscriptionCouponModel.create(payload);
  },

  async updateCouponById(couponId, updatePayload) {
    return SubscriptionCouponModel.findByIdAndUpdate(couponId, updatePayload, {
      new: true,
      runValidators: true,
    });
  },

  async incrementCouponRedemption(couponId) {
    return SubscriptionCouponModel.findByIdAndUpdate(
      couponId,
      {
        $inc: {
          redeemedCount: 1,
        },
      },
      {
        new: true,
      },
    );
  },

  async getConfig() {
    return SubscriptionConfigModel.findOne({ configKey: "default" });
  },

  async upsertConfig(updatePayload) {
    return SubscriptionConfigModel.findOneAndUpdate(
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

  async createSubscription(payload) {
    return SubscriptionModel.create(payload);
  },

  async findSubscriptionById(subscriptionId) {
    return SubscriptionModel.findById(subscriptionId);
  },

  async findByPaymentIntentId(paymentIntentId) {
    return SubscriptionModel.findOne({ lastPaymentIntentId: paymentIntentId });
  },

  async findLatestActiveLikeByUserId(userId) {
    return SubscriptionModel.findOne({
      userId,
      status: { $in: ACTIVE_LIKE_STATUSES },
    }).sort({ createdAt: -1 });
  },

  async listByUserId(userId) {
    return SubscriptionModel.find({ userId }).sort({ createdAt: -1 });
  },

  async updateSubscriptionById(subscriptionId, updatePayload) {
    return SubscriptionModel.findByIdAndUpdate(subscriptionId, updatePayload, {
      new: true,
      runValidators: true,
    });
  },

  async findExpiredGraceSubscriptions(at = new Date()) {
    return SubscriptionModel.find({
      status: SUBSCRIPTION_STATUSES.GRACE_PERIOD,
      gracePeriodEndsAt: { $lte: at },
    }).sort({ gracePeriodEndsAt: 1 });
  },

  async findRenewalReminderCandidates({ from, to }) {
    return SubscriptionModel.find({
      status: SUBSCRIPTION_STATUSES.ACTIVE,
      autoRenew: true,
      nextBillingAt: {
        $gte: from,
        $lte: to,
      },
    }).sort({ nextBillingAt: 1 });
  },

  async findGracePeriodWarningCandidates({ from, to }) {
    return SubscriptionModel.find({
      status: SUBSCRIPTION_STATUSES.GRACE_PERIOD,
      gracePeriodEndsAt: {
        $gte: from,
        $lte: to,
      },
    }).sort({ gracePeriodEndsAt: 1 });
  },

  async createHistory(payload) {
    return SubscriptionHistoryModel.create(payload);
  },

  async listHistoryByUserId(userId, { eventType, status } = {}) {
    const filter = { userId };

    if (eventType) {
      filter.eventType = eventType;
    }

    if (status) {
      filter.$or = [{ previousStatus: status }, { nextStatus: status }];
    }

    return SubscriptionHistoryModel.find(filter).sort({ occurredAt: -1 });
  },

  async listHistoryBySubscriptionId(subscriptionId) {
    return SubscriptionHistoryModel.find({ subscriptionId }).sort({
      occurredAt: -1,
    });
  },

  async createCancellationEvent(payload) {
    return SubscriptionCancellationModel.create(payload);
  },

  async listCancellationEventsByUserId(userId) {
    return SubscriptionCancellationModel.find({ userId }).sort({
      canceledAt: -1,
    });
  },
};
