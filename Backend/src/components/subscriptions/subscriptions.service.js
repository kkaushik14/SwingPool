import { config } from "../../config/index.js";
import { DAY_IN_MS } from "../../constants/index.js";
import { AppError, ConflictError, DomainError } from "../../errors/index.js";
import { logAuditEvent } from "../../services/index.js";
import {
  addMoney,
  multiplyMoney,
  subtractMoney,
  toMinorUnits,
} from "../../utils/index.js";
import {
  buildDefaultContributionRule,
  calculateSubscriptionAllocationSplit,
} from "../charities/charity-accounting.js";
import { CHARITIES_STATUSES } from "../charities/charities.enums.js";
import { charitiesRepository } from "../charities/charities.repository.js";
import { paymentsService } from "../payments/payments.service.js";
import { PAYMENT_STATES } from "../payments/payments.enums.js";
import { usersRepository } from "../users/users.repository.js";
import { usersService } from "../users/users.service.js";
import { NOTIFICATION_EVENT_TYPES } from "../notifications/notifications.enums.js";
import { dispatchNotificationEvent } from "../notifications/notifications.dispatcher.js";

import {
  toCancellationEventDto,
  toCouponDto,
  toPlanDto,
  toSubscriptionConfigDto,
  toSubscriptionDto,
  toSubscriptionHistoryDto,
} from "./subscriptions.dto.js";
import {
  COUPON_DISCOUNT_TYPES,
  DEFAULT_SUBSCRIPTION_PLANS,
  SUBSCRIPTION_HISTORY_EVENT_TYPES,
  SUBSCRIPTION_PLAN_CODES,
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_UPGRADE_PATHS,
} from "./subscriptions.enums.js";
import { subscriptionsRepository } from "./subscriptions.repository.js";
import { mapDomainSubscriptionStatusToUserSubscriptionStatus } from "./subscription-status.mapper.js";

const toMoneyNumber = (value) =>
  Number.parseFloat(Number(value || 0).toFixed(2));

const nowDate = () => new Date();

const isActiveLikeStatus = (status) => {
  return [
    SUBSCRIPTION_STATUSES.PENDING_PAYMENT,
    SUBSCRIPTION_STATUSES.ACTIVE,
    SUBSCRIPTION_STATUSES.GRACE_PERIOD,
    SUBSCRIPTION_STATUSES.PAYMENT_FAILED,
  ].includes(status);
};

const ensurePlanExists = async (planCode) => {
  const plan = await subscriptionsRepository.findPlanByCode(planCode);

  if (!plan || !plan.isActive) {
    throw AppError.notFound(`Subscription plan '${planCode}' is unavailable.`);
  }

  return plan;
};

const normalizePlanCode = (planCode) =>
  String(planCode || "")
    .trim()
    .toLowerCase();

const resolveEffectiveConfig = async () => {
  const existingConfig = await subscriptionsRepository.getConfig();

  if (existingConfig) {
    return existingConfig;
  }

  return subscriptionsRepository.upsertConfig({
    gracePeriodDays: config.subscription.gracePeriodDays,
    mandatoryCharityPercentage: config.subscription.mandatoryCharityPercentage,
    currency: config.subscription.currency,
  });
};

const ensureDefaultPlansSeeded = async () => {
  for (const plan of DEFAULT_SUBSCRIPTION_PLANS) {
    const existing = await subscriptionsRepository.findPlanByCode(plan.code);

    if (existing) {
      continue;
    }

    await subscriptionsRepository.createPlan({
      ...plan,
      code: normalizePlanCode(plan.code),
    });
  }
};

const computeCouponDiscountInr = ({ coupon, plan, baseAmountInr, now }) => {
  if (!coupon) {
    return {
      discountInr: 0,
      appliedCouponCode: null,
    };
  }

  if (!coupon.isActive) {
    throw new DomainError("Coupon is inactive.");
  }

  if (coupon.validFrom && now < new Date(coupon.validFrom)) {
    throw new DomainError("Coupon is not yet active.");
  }

  if (coupon.validTo && now > new Date(coupon.validTo)) {
    throw new DomainError("Coupon has expired.");
  }

  if (coupon.maxRedemptions && coupon.redeemedCount >= coupon.maxRedemptions) {
    throw new DomainError("Coupon redemption limit reached.");
  }

  if (coupon.minOrderAmountInr && baseAmountInr < coupon.minOrderAmountInr) {
    throw new DomainError("Coupon minimum order amount not satisfied.");
  }

  if (
    coupon.applicablePlanCodes?.length > 0 &&
    !coupon.applicablePlanCodes.includes(plan.code)
  ) {
    throw new DomainError("Coupon cannot be applied to this plan.");
  }

  let discountInr = 0;

  if (coupon.discountType === COUPON_DISCOUNT_TYPES.PERCENTAGE) {
    discountInr = toMoneyNumber(
      multiplyMoney(baseAmountInr, coupon.discountValue / 100),
    );

    if (coupon.maxDiscountInr !== null && coupon.maxDiscountInr !== undefined) {
      discountInr = Math.min(discountInr, coupon.maxDiscountInr);
    }
  } else {
    discountInr = toMoneyNumber(coupon.discountValue);
  }

  discountInr = Math.min(discountInr, baseAmountInr);

  return {
    discountInr,
    appliedCouponCode: coupon.code,
  };
};

const buildBillingWindow = ({ startAt, billingCycleDays }) => {
  const start = startAt || nowDate();
  const end = new Date(start.getTime() + billingCycleDays * DAY_IN_MS);

  return {
    startAt: start,
    endAt: end,
    nextBillingAt: end,
  };
};

const createHistoryEntry = async ({
  subscription,
  eventType,
  previousStatus = null,
  nextStatus = null,
  previousPlanCode = null,
  nextPlanCode = null,
  actorId = null,
  metadata = {},
}) => {
  return subscriptionsRepository.createHistory({
    subscriptionId: subscription.id,
    userId: subscription.userId,
    eventType,
    previousStatus,
    nextStatus,
    previousPlanCode,
    nextPlanCode,
    actorId,
    metadata,
    occurredAt: nowDate(),
  });
};

const validateUpgradePath = ({ currentPlan, targetPlan }) => {
  if (!currentPlan || !targetPlan) {
    throw AppError.notFound("Unable to resolve upgrade plans.");
  }

  if (targetPlan.hierarchyLevel <= currentPlan.hierarchyLevel) {
    throw new DomainError("Downgrade or same-plan switch is not allowed.");
  }

  const explicitPaths = SUBSCRIPTION_UPGRADE_PATHS[currentPlan.code];

  if (
    explicitPaths &&
    explicitPaths.length > 0 &&
    !explicitPaths.includes(targetPlan.code)
  ) {
    throw new DomainError(
      `Upgrade path not allowed from ${currentPlan.code} to ${targetPlan.code}.`,
    );
  }
};

const calculateProration = ({ subscription, currentPlan, targetPlan, at }) => {
  const calculationTime = at || nowDate();
  const periodStart = subscription.startAt
    ? new Date(subscription.startAt)
    : new Date(subscription.createdAt);
  const periodEnd = subscription.endAt
    ? new Date(subscription.endAt)
    : new Date(
        periodStart.getTime() + currentPlan.billingCycleDays * DAY_IN_MS,
      );

  const totalPeriodMs = Math.max(
    periodEnd.getTime() - periodStart.getTime(),
    1,
  );
  const remainingMs = Math.max(
    periodEnd.getTime() - calculationTime.getTime(),
    0,
  );
  const remainingRatio = Math.min(remainingMs / totalPeriodMs, 1);

  const unusedValueInr = toMoneyNumber(
    multiplyMoney(subscription.planPriceInrSnapshot, remainingRatio),
  );
  const proratedUpgradeChargeInr = toMoneyNumber(
    Math.max(
      Number.parseFloat(subtractMoney(targetPlan.priceInr, unusedValueInr)),
      0,
    ),
  );

  return {
    calculatedAt: calculationTime,
    periodStart,
    periodEnd,
    remainingRatio: Number(remainingRatio.toFixed(6)),
    unusedValueInr,
    targetPlanPriceInr: toMoneyNumber(targetPlan.priceInr),
    proratedUpgradeChargeInr,
  };
};

const syncUserSubscriptionStatus = async (userId, subscriptionStatus) => {
  const mappedStatus =
    mapDomainSubscriptionStatusToUserSubscriptionStatus(subscriptionStatus);

  await usersRepository.updateById(userId, {
    subscriptionStatus: mappedStatus,
  });

  return mappedStatus;
};

const assertSubscriptionAccessible = ({
  subscription,
  requesterUserId,
  requesterRole,
}) => {
  if (!subscription) {
    throw AppError.notFound("Subscription not found.");
  }

  const isOwner = String(subscription.userId) === String(requesterUserId);
  const isAdmin = requesterRole === "admin";

  if (!isOwner && !isAdmin) {
    throw AppError.forbidden("You do not have access to this subscription.");
  }
};

export const subscriptionsService = {
  async getPublicPlans() {
    await ensureDefaultPlansSeeded();
    const plans = await subscriptionsRepository.listPlans({
      includeInactive: false,
    });
    return plans.map(toPlanDto);
  },

  async adminListPlans({ includeInactive = true } = {}) {
    await ensureDefaultPlansSeeded();
    const plans = await subscriptionsRepository.listPlans({ includeInactive });
    return plans.map(toPlanDto);
  },

  async adminCreatePlan(payload, requestContext = {}) {
    const created = await subscriptionsRepository.createPlan({
      ...payload,
      code: normalizePlanCode(payload.code),
    });

    logAuditEvent({
      action: "subscriptions.plan.create",
      actorId: requestContext.actorId,
      actorRole: requestContext.role,
      entity: "SubscriptionPlan",
      entityId: created.id,
      requestId: requestContext.requestId,
      metadata: {
        code: created.code,
      },
    });

    return toPlanDto(created);
  },

  async adminUpdatePlan(planId, payload, requestContext = {}) {
    const updated = await subscriptionsRepository.updatePlanById(
      planId,
      payload,
    );

    if (!updated) {
      throw AppError.notFound("Subscription plan not found.");
    }

    logAuditEvent({
      action: "subscriptions.plan.update",
      actorId: requestContext.actorId,
      actorRole: requestContext.role,
      entity: "SubscriptionPlan",
      entityId: updated.id,
      requestId: requestContext.requestId,
      metadata: {
        updatedFields: Object.keys(payload),
      },
    });

    return toPlanDto(updated);
  },

  async adminListCoupons({ includeInactive = true } = {}) {
    const coupons = await subscriptionsRepository.listCoupons({
      includeInactive,
    });
    return coupons.map(toCouponDto);
  },

  async adminCreateCoupon(payload, requestContext = {}) {
    const created = await subscriptionsRepository.createCoupon(payload);

    logAuditEvent({
      action: "subscriptions.coupon.create",
      actorId: requestContext.actorId,
      actorRole: requestContext.role,
      entity: "SubscriptionCoupon",
      entityId: created.id,
      requestId: requestContext.requestId,
      metadata: {
        code: created.code,
      },
    });

    return toCouponDto(created);
  },

  async adminUpdateCoupon(couponId, payload, requestContext = {}) {
    const updated = await subscriptionsRepository.updateCouponById(
      couponId,
      payload,
    );

    if (!updated) {
      throw AppError.notFound("Subscription coupon not found.");
    }

    logAuditEvent({
      action: "subscriptions.coupon.update",
      actorId: requestContext.actorId,
      actorRole: requestContext.role,
      entity: "SubscriptionCoupon",
      entityId: updated.id,
      requestId: requestContext.requestId,
      metadata: {
        updatedFields: Object.keys(payload),
      },
    });

    return toCouponDto(updated);
  },

  async getConfig() {
    const configDoc = await resolveEffectiveConfig();
    return toSubscriptionConfigDto(configDoc);
  },

  async adminUpdateConfig(payload, requestContext = {}) {
    const updated = await subscriptionsRepository.upsertConfig({
      ...payload,
      updatedBy: requestContext.actorId || null,
    });

    logAuditEvent({
      action: "subscriptions.config.update",
      actorId: requestContext.actorId,
      actorRole: requestContext.role,
      entity: "SubscriptionConfig",
      entityId: updated.id,
      requestId: requestContext.requestId,
      metadata: {
        updatedFields: Object.keys(payload),
      },
    });

    return toSubscriptionConfigDto(updated);
  },

  async createSubscriptionForUser(userId, payload, requestContext = {}) {
    await usersService.assertSubscriptionEligibility(userId);
    await ensureDefaultPlansSeeded();

    const existing =
      await subscriptionsRepository.findLatestActiveLikeByUserId(userId);

    if (existing && isActiveLikeStatus(existing.status)) {
      throw new ConflictError(
        "User already has an active or pending subscription lifecycle.",
      );
    }

    const selectedPlanCode = normalizePlanCode(payload.planCode);
    const plan = await ensurePlanExists(selectedPlanCode);
    const effectiveConfig = await resolveEffectiveConfig();
    const activeContributionRule =
      (await charitiesRepository.getContributionRule(
        String(effectiveConfig.currency || "INR"),
      )) || buildDefaultContributionRule();

    const baseAmountInr = toMoneyNumber(plan.priceInr);
    const optionalDonationInr = toMoneyNumber(
      Math.max(Number(payload.optionalDonationInr || 0), 0),
    );
    let coupon = null;

    if (payload.couponCode) {
      coupon = await subscriptionsRepository.findCouponByCode(
        payload.couponCode,
      );

      if (!coupon) {
        throw AppError.notFound("Coupon not found.");
      }
    }

    const { discountInr, appliedCouponCode } = computeCouponDiscountInr({
      coupon,
      plan,
      baseAmountInr,
      now: nowDate(),
    });

    const payableAmountInr = toMoneyNumber(
      Math.max(Number.parseFloat(subtractMoney(baseAmountInr, discountInr)), 0),
    );

    const totalPayableAmountInr = toMoneyNumber(
      addMoney(payableAmountInr, optionalDonationInr),
    );

    const selectedCharityId =
      payload.charityId ||
      (await charitiesRepository.getActiveSelectionByUserId(userId))
        ?.charityId ||
      null;

    if (!selectedCharityId) {
      throw new DomainError(
        "Please select a charity before starting a subscription. Charity changes apply to future payments only.",
      );
    }

    const selectedCharity =
      await charitiesRepository.findById(selectedCharityId);

    if (
      !selectedCharity ||
      selectedCharity.status !== CHARITIES_STATUSES.ACTIVE
    ) {
      throw new DomainError("Selected charity is inactive or unavailable.");
    }

    const splitPreview = calculateSubscriptionAllocationSplit({
      subscriptionBaseMinor: toMinorUnits(payableAmountInr, 2),
      optionalDonationMinor: toMinorUnits(optionalDonationInr, 2),
      gatewayFeePercentage: activeContributionRule.gatewayFeePercentage,
      prizePoolPercentage: activeContributionRule.prizePoolPercentage,
      mandatoryCharityPercentage:
        activeContributionRule.mandatoryCharityPercentage,
    });

    const charityContributionInr = toMoneyNumber(
      splitPreview.allocations.mandatoryPlusOptionalCharityMajor,
    );

    const paymentPayload = {
      amount: toMinorUnits(totalPayableAmountInr, 2),
      currency: String(effectiveConfig.currency || "INR").toLowerCase(),
      description: `Subscription payment for ${plan.name}`,
      sourceDomain: "subscription",
      sourceEntityId: String(selectedCharityId),
      sourceAction: "activation",
      metadata: {
        domain: "subscription",
        planCode: plan.code,
        couponCode: appliedCouponCode || "",
        charityId: String(selectedCharityId),
        subscriptionBaseMinor: splitPreview.totals.subscriptionBaseMinor,
        optionalDonationMinor: splitPreview.totals.optionalDonationMinor,
        allocationSnapshot: {
          gatewayFeePercentage: activeContributionRule.gatewayFeePercentage,
          prizePoolPercentage: activeContributionRule.prizePoolPercentage,
          mandatoryCharityPercentage:
            activeContributionRule.mandatoryCharityPercentage,
        },
        ...(payload.metadata || {}),
      },
    };

    const payment = await paymentsService.createPaymentIntentForUser(
      userId,
      paymentPayload,
      requestContext,
    );

    const created = await subscriptionsRepository.createSubscription({
      userId,
      planId: plan.id,
      planCode: plan.code,
      planNameSnapshot: plan.name,
      planPriceInrSnapshot: baseAmountInr,
      status: SUBSCRIPTION_STATUSES.PENDING_PAYMENT,
      currency: effectiveConfig.currency,
      charityId: selectedCharityId,
      mandatoryCharityPercentageSnapshot:
        activeContributionRule.mandatoryCharityPercentage,
      charityContributionInr,
      latestCouponCode: appliedCouponCode || "",
      lastPaymentIntentId: payment.stripePaymentIntentId,
      lastPaymentStatus: payment.state,
      metadata: {
        pricing: {
          baseAmountInr,
          discountInr,
          payableAmountInr,
          optionalDonationInr,
          totalPayableAmountInr,
          splitPreview,
        },
        ...(payload.metadata || {}),
      },
    });

    await createHistoryEntry({
      subscription: created,
      eventType: SUBSCRIPTION_HISTORY_EVENT_TYPES.CREATED,
      previousStatus: null,
      nextStatus: created.status,
      previousPlanCode: null,
      nextPlanCode: created.planCode,
      actorId: requestContext.actorId || userId,
      metadata: {
        baseAmountInr,
        discountInr,
        payableAmountInr,
        optionalDonationInr,
        totalPayableAmountInr,
        couponCode: appliedCouponCode || null,
      },
    });

    logAuditEvent({
      action: "subscriptions.create",
      actorId: userId,
      actorRole: requestContext.role,
      entity: "Subscription",
      entityId: created.id,
      requestId: requestContext.requestId,
      metadata: {
        planCode: created.planCode,
        payableAmountInr: totalPayableAmountInr,
        paymentIntentId: payment.stripePaymentIntentId,
      },
    });

    return {
      subscription: toSubscriptionDto(created),
      payment,
      pricing: {
        baseAmountInr,
        discountInr,
        payableAmountInr: totalPayableAmountInr,
        charityContributionInr,
        mandatoryCharityPercentage:
          activeContributionRule.mandatoryCharityPercentage,
        optionalDonationInr,
        splitPreview,
      },
    };
  },

  async confirmSubscriptionPayment({
    subscriptionId,
    requesterUserId,
    requesterRole,
    paymentIntentId,
    paymentReference,
    requestContext = {},
  }) {
    const subscription =
      await subscriptionsRepository.findSubscriptionById(subscriptionId);

    assertSubscriptionAccessible({
      subscription,
      requesterUserId,
      requesterRole,
    });

    if (
      !subscription.lastPaymentIntentId ||
      subscription.lastPaymentIntentId !== paymentIntentId
    ) {
      throw new DomainError(
        "Payment intent does not match the subscription record.",
      );
    }

    if (
      ![
        SUBSCRIPTION_STATUSES.PENDING_PAYMENT,
        SUBSCRIPTION_STATUSES.PAYMENT_FAILED,
      ].includes(subscription.status)
    ) {
      throw new DomainError(
        "Subscription is not awaiting payment confirmation.",
      );
    }

    const persistedPayment = await paymentsService.confirmPaymentIntentForUser(
      subscription.userId,
      paymentIntentId,
    );

    if (
      [PAYMENT_STATES.PROCESSING, PAYMENT_STATES.RETRY_REQUIRED].includes(
        persistedPayment.state,
      )
    ) {
      throw new ConflictError(
        "Payment is still processing. Subscription state will be finalized from Stripe webhook events.",
      );
    }

    const plan = await subscriptionsRepository.findPlanById(
      subscription.planId,
    );

    if (!plan) {
      throw AppError.notFound(
        "Subscription plan for subscription record was not found.",
      );
    }

    if (
      [
        PAYMENT_STATES.FAILED,
        PAYMENT_STATES.CANCELED,
        PAYMENT_STATES.TIMEOUT,
      ].includes(persistedPayment.state)
    ) {
      if (subscription.status === SUBSCRIPTION_STATUSES.PAYMENT_FAILED) {
        return toSubscriptionDto(subscription);
      }

      const failed = await subscriptionsRepository.updateSubscriptionById(
        subscription.id,
        {
          status: SUBSCRIPTION_STATUSES.PAYMENT_FAILED,
          lastPaymentStatus: persistedPayment.state,
          metadata: {
            ...(subscription.metadata || {}),
            paymentReference: paymentReference || null,
            webhookDriven: true,
          },
        },
      );

      await createHistoryEntry({
        subscription: failed,
        eventType: SUBSCRIPTION_HISTORY_EVENT_TYPES.PAYMENT_FAILED,
        previousStatus: subscription.status,
        nextStatus: failed.status,
        previousPlanCode: failed.planCode,
        nextPlanCode: failed.planCode,
        actorId: requestContext.actorId || requesterUserId,
        metadata: {
          paymentIntentId,
          paymentReference: paymentReference || null,
          paymentState: persistedPayment.state,
        },
      });

      await syncUserSubscriptionStatus(subscription.userId, failed.status);

      return toSubscriptionDto(failed);
    }

    await usersService.assertSubscriptionEligibility(subscription.userId);

    const billingWindow = buildBillingWindow({
      startAt: nowDate(),
      billingCycleDays: plan.billingCycleDays,
    });

    const activated = await subscriptionsRepository.updateSubscriptionById(
      subscription.id,
      {
        status: SUBSCRIPTION_STATUSES.ACTIVE,
        startAt: billingWindow.startAt,
        endAt: billingWindow.endAt,
        nextBillingAt: billingWindow.nextBillingAt,
        gracePeriodEndsAt: null,
        lastPaymentStatus: "succeeded",
        metadata: {
          ...(subscription.metadata || {}),
          paymentReference: paymentReference || null,
          webhookDriven: true,
        },
      },
    );

    if (activated.latestCouponCode) {
      const coupon = await subscriptionsRepository.findCouponByCode(
        activated.latestCouponCode,
      );

      if (coupon) {
        await subscriptionsRepository.incrementCouponRedemption(coupon.id);
      }
    }

    await createHistoryEntry({
      subscription: activated,
      eventType: SUBSCRIPTION_HISTORY_EVENT_TYPES.PAYMENT_CONFIRMED,
      previousStatus: subscription.status,
      nextStatus: activated.status,
      previousPlanCode: activated.planCode,
      nextPlanCode: activated.planCode,
      actorId: requestContext.actorId || requesterUserId,
      metadata: {
        paymentIntentId,
        paymentReference: paymentReference || null,
        paymentState: persistedPayment.state,
      },
    });

    await syncUserSubscriptionStatus(subscription.userId, activated.status);

    logAuditEvent({
      action: "subscriptions.payment.confirm",
      actorId: requestContext.actorId || requesterUserId,
      actorRole: requestContext.role || requesterRole,
      entity: "Subscription",
      entityId: activated.id,
      requestId: requestContext.requestId,
      metadata: {
        paymentIntentId,
        paymentState: persistedPayment.state,
      },
    });

    return toSubscriptionDto(activated);
  },

  async cancelSubscriptionForUser({
    subscriptionId,
    requesterUserId,
    requesterRole,
    reason = "",
    requestContext = {},
  }) {
    const subscription =
      await subscriptionsRepository.findSubscriptionById(subscriptionId);

    assertSubscriptionAccessible({
      subscription,
      requesterUserId,
      requesterRole,
    });

    if (
      [SUBSCRIPTION_STATUSES.CANCELED, SUBSCRIPTION_STATUSES.EXPIRED].includes(
        subscription.status,
      )
    ) {
      throw new DomainError("Subscription is already closed.");
    }

    const canceledAt = nowDate();

    const canceledSubscription =
      await subscriptionsRepository.updateSubscriptionById(subscription.id, {
        status: SUBSCRIPTION_STATUSES.CANCELED,
        canceledAt,
        endAt: canceledAt,
        autoRenew: false,
        gracePeriodEndsAt: null,
        metadata: {
          ...(subscription.metadata || {}),
          cancellationReason: reason || "",
        },
      });

    const cancellationEvent =
      await subscriptionsRepository.createCancellationEvent({
        subscriptionId: subscription.id,
        userId: subscription.userId,
        canceledAt,
        reason: reason || "",
        immediate: true,
        statusBeforeCancel: subscription.status,
        statusAfterCancel: SUBSCRIPTION_STATUSES.CANCELED,
        actorId: requestContext.actorId || requesterUserId,
        metadata: {},
      });

    await createHistoryEntry({
      subscription: canceledSubscription,
      eventType: SUBSCRIPTION_HISTORY_EVENT_TYPES.CANCELED,
      previousStatus: subscription.status,
      nextStatus: canceledSubscription.status,
      previousPlanCode: canceledSubscription.planCode,
      nextPlanCode: canceledSubscription.planCode,
      actorId: requestContext.actorId || requesterUserId,
      metadata: {
        reason: reason || "",
      },
    });

    await syncUserSubscriptionStatus(
      subscription.userId,
      canceledSubscription.status,
    );

    logAuditEvent({
      action: "subscriptions.cancel",
      actorId: requestContext.actorId || requesterUserId,
      actorRole: requestContext.role || requesterRole,
      entity: "Subscription",
      entityId: subscription.id,
      requestId: requestContext.requestId,
      metadata: {
        reason: reason || "",
      },
    });

    return {
      subscription: toSubscriptionDto(canceledSubscription),
      cancellationEvent: toCancellationEventDto(cancellationEvent),
    };
  },

  async markRenewalFailed(subscriptionId, reason = "", requestContext = {}) {
    const subscription =
      await subscriptionsRepository.findSubscriptionById(subscriptionId);

    if (!subscription) {
      throw AppError.notFound("Subscription not found.");
    }

    if (subscription.status !== SUBSCRIPTION_STATUSES.ACTIVE) {
      throw new DomainError(
        "Renewal failure can only be processed for active subscriptions.",
      );
    }

    const effectiveConfig = await resolveEffectiveConfig();
    const gracePeriodEndsAt = new Date(
      nowDate().getTime() + effectiveConfig.gracePeriodDays * DAY_IN_MS,
    );

    const updated = await subscriptionsRepository.updateSubscriptionById(
      subscription.id,
      {
        status: SUBSCRIPTION_STATUSES.GRACE_PERIOD,
        gracePeriodEndsAt,
        lastPaymentStatus: "failed",
        metadata: {
          ...(subscription.metadata || {}),
          renewalFailureReason: reason || "",
        },
      },
    );

    await createHistoryEntry({
      subscription: updated,
      eventType: SUBSCRIPTION_HISTORY_EVENT_TYPES.RENEWAL_FAILED,
      previousStatus: subscription.status,
      nextStatus: updated.status,
      previousPlanCode: updated.planCode,
      nextPlanCode: updated.planCode,
      actorId: requestContext.actorId,
      metadata: {
        reason: reason || "",
        gracePeriodEndsAt,
      },
    });

    await syncUserSubscriptionStatus(updated.userId, updated.status);

    dispatchNotificationEvent({
      scope: "subscriptions",
      userId: updated.userId,
      eventType: NOTIFICATION_EVENT_TYPES.GRACE_PERIOD_WARNING,
      context: {
        subscriptionId: updated.id,
        gracePeriodEndsAt,
        reason: reason || "",
      },
      dedupeKey: `subscription:${updated.id}:grace_period:${new Date(gracePeriodEndsAt).toISOString()}`,
      requestContext,
    });

    return toSubscriptionDto(updated);
  },

  async processGracePeriodExpirations(runAt = nowDate(), requestContext = {}) {
    const expiredGraceSubscriptions =
      await subscriptionsRepository.findExpiredGraceSubscriptions(runAt);

    const expired = [];

    for (const subscription of expiredGraceSubscriptions) {
      const endedSubscription =
        await subscriptionsRepository.updateSubscriptionById(subscription.id, {
          status: SUBSCRIPTION_STATUSES.EXPIRED,
          endAt: subscription.gracePeriodEndsAt || runAt,
          autoRenew: false,
          gracePeriodEndsAt: null,
        });

      await createHistoryEntry({
        subscription: endedSubscription,
        eventType: SUBSCRIPTION_HISTORY_EVENT_TYPES.GRACE_PERIOD_ENDED,
        previousStatus: subscription.status,
        nextStatus: endedSubscription.status,
        previousPlanCode: endedSubscription.planCode,
        nextPlanCode: endedSubscription.planCode,
        actorId: requestContext.actorId || null,
        metadata: {
          processedAt: runAt,
        },
      });

      await syncUserSubscriptionStatus(
        endedSubscription.userId,
        endedSubscription.status,
      );

      dispatchNotificationEvent({
        scope: "subscriptions",
        userId: endedSubscription.userId,
        eventType: NOTIFICATION_EVENT_TYPES.SUBSCRIPTION_EXPIRY,
        context: {
          subscriptionId: endedSubscription.id,
          expiredAt: endedSubscription.endAt || runAt,
          previousStatus: subscription.status,
        },
        dedupeKey: `subscription:${endedSubscription.id}:expired:${new Date(endedSubscription.endAt || runAt).toISOString()}`,
        requestContext,
      });

      expired.push(toSubscriptionDto(endedSubscription));
    }

    return {
      processedAt: runAt,
      expiredCount: expired.length,
      expiredSubscriptions: expired,
    };
  },

  async calculateUpgradePreviewForUser({
    subscriptionId,
    requesterUserId,
    requesterRole,
    targetPlanCode,
  }) {
    const subscription =
      await subscriptionsRepository.findSubscriptionById(subscriptionId);

    assertSubscriptionAccessible({
      subscription,
      requesterUserId,
      requesterRole,
    });

    if (subscription.status !== SUBSCRIPTION_STATUSES.ACTIVE) {
      throw new DomainError("Only active subscriptions can be upgraded.");
    }

    const currentPlan = await subscriptionsRepository.findPlanById(
      subscription.planId,
    );
    const targetPlan = await ensurePlanExists(
      normalizePlanCode(targetPlanCode),
    );

    validateUpgradePath({
      currentPlan,
      targetPlan,
    });

    const proration = calculateProration({
      subscription,
      currentPlan,
      targetPlan,
      at: nowDate(),
    });

    return {
      subscription: toSubscriptionDto(subscription),
      currentPlan: toPlanDto(currentPlan),
      targetPlan: toPlanDto(targetPlan),
      proration,
    };
  },

  async upgradeSubscriptionForUser({
    subscriptionId,
    requesterUserId,
    requesterRole,
    targetPlanCode,
    paymentConfirmed,
    paymentReference,
    requestContext = {},
  }) {
    const preview = await this.calculateUpgradePreviewForUser({
      subscriptionId,
      requesterUserId,
      requesterRole,
      targetPlanCode,
    });

    if (!paymentConfirmed) {
      throw new DomainError(
        "Upgrade requires successful payment confirmation.",
      );
    }

    const { subscription, targetPlan, proration } = preview;

    const billingWindow = buildBillingWindow({
      startAt: nowDate(),
      billingCycleDays: targetPlan.billingCycleDays,
    });

    const upgraded = await subscriptionsRepository.updateSubscriptionById(
      subscription.id,
      {
        planId: targetPlan.id,
        planCode: targetPlan.code,
        planNameSnapshot: targetPlan.name,
        planPriceInrSnapshot: targetPlan.priceInr,
        startAt: billingWindow.startAt,
        endAt: billingWindow.endAt,
        nextBillingAt: billingWindow.nextBillingAt,
        status: SUBSCRIPTION_STATUSES.ACTIVE,
        lastPaymentStatus: "succeeded",
        metadata: {
          ...(subscription.metadata || {}),
          latestUpgrade: {
            targetPlanCode: targetPlan.code,
            paymentReference: paymentReference || null,
            proration,
          },
        },
      },
    );

    await createHistoryEntry({
      subscription: upgraded,
      eventType: SUBSCRIPTION_HISTORY_EVENT_TYPES.UPGRADED,
      previousStatus: subscription.status,
      nextStatus: upgraded.status,
      previousPlanCode: subscription.planCode,
      nextPlanCode: targetPlan.code,
      actorId: requestContext.actorId || requesterUserId,
      metadata: {
        paymentReference: paymentReference || null,
        proration,
      },
    });

    await syncUserSubscriptionStatus(upgraded.userId, upgraded.status);

    return {
      subscription: toSubscriptionDto(upgraded),
      proration,
    };
  },

  async listUserSubscriptions(userId) {
    const subscriptions = await subscriptionsRepository.listByUserId(userId);
    return subscriptions.map(toSubscriptionDto);
  },

  async listUserSubscriptionHistory(userId, filters = {}) {
    const history = await subscriptionsRepository.listHistoryByUserId(
      userId,
      filters,
    );
    return history.map(toSubscriptionHistoryDto);
  },

  async listUserCancellationEvents(userId) {
    const events =
      await subscriptionsRepository.listCancellationEventsByUserId(userId);
    return events.map(toCancellationEventDto);
  },
};
