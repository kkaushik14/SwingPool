const toPlain = (value) => (value?.toObject ? value.toObject() : value);

export const toPlanDto = (plan) => {
  if (!plan) {
    return null;
  }

  const item = toPlain(plan);

  return {
    id: item.id || item._id?.toString(),
    code: item.code,
    name: item.name,
    description: item.description,
    priceInr: item.priceInr,
    billingCycleDays: item.billingCycleDays,
    hierarchyLevel: item.hierarchyLevel,
    currency: item.currency,
    isDefault: item.isDefault,
    isActive: item.isActive,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const toCouponDto = (coupon) => {
  if (!coupon) {
    return null;
  }

  const item = toPlain(coupon);

  return {
    id: item.id || item._id?.toString(),
    code: item.code,
    description: item.description,
    discountType: item.discountType,
    discountValue: item.discountValue,
    maxDiscountInr: item.maxDiscountInr,
    minOrderAmountInr: item.minOrderAmountInr,
    maxRedemptions: item.maxRedemptions,
    redeemedCount: item.redeemedCount,
    validFrom: item.validFrom,
    validTo: item.validTo,
    applicablePlanCodes: item.applicablePlanCodes,
    isActive: item.isActive,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const toSubscriptionConfigDto = (config) => {
  if (!config) {
    return null;
  }

  const item = toPlain(config);

  return {
    gracePeriodDays: item.gracePeriodDays,
    mandatoryCharityPercentage: item.mandatoryCharityPercentage,
    currency: item.currency,
    metadata: item.metadata || {},
    updatedAt: item.updatedAt,
  };
};

export const toSubscriptionDto = (subscription) => {
  if (!subscription) {
    return null;
  }

  const item = toPlain(subscription);

  return {
    id: item.id || item._id?.toString(),
    userId: item.userId?.toString?.() || item.userId,
    planId: item.planId?.toString?.() || item.planId,
    planCode: item.planCode,
    planNameSnapshot: item.planNameSnapshot,
    planPriceInrSnapshot: item.planPriceInrSnapshot,
    currency: item.currency,
    status: item.status,
    startAt: item.startAt,
    endAt: item.endAt,
    nextBillingAt: item.nextBillingAt,
    gracePeriodEndsAt: item.gracePeriodEndsAt,
    canceledAt: item.canceledAt,
    charityId: item.charityId,
    mandatoryCharityPercentageSnapshot: item.mandatoryCharityPercentageSnapshot,
    charityContributionInr: item.charityContributionInr,
    latestCouponCode: item.latestCouponCode,
    lastPaymentIntentId: item.lastPaymentIntentId,
    lastPaymentStatus: item.lastPaymentStatus,
    autoRenew: item.autoRenew,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const toSubscriptionHistoryDto = (entry) => {
  if (!entry) {
    return null;
  }

  const item = toPlain(entry);

  return {
    id: item.id || item._id?.toString(),
    subscriptionId: item.subscriptionId,
    userId: item.userId,
    eventType: item.eventType,
    previousStatus: item.previousStatus,
    nextStatus: item.nextStatus,
    previousPlanCode: item.previousPlanCode,
    nextPlanCode: item.nextPlanCode,
    actorId: item.actorId,
    metadata: item.metadata || {},
    occurredAt: item.occurredAt,
    createdAt: item.createdAt,
  };
};

export const toCancellationEventDto = (entry) => {
  if (!entry) {
    return null;
  }

  const item = toPlain(entry);

  return {
    id: item.id || item._id?.toString(),
    subscriptionId: item.subscriptionId,
    userId: item.userId,
    canceledAt: item.canceledAt,
    reason: item.reason,
    immediate: item.immediate,
    statusBeforeCancel: item.statusBeforeCancel,
    statusAfterCancel: item.statusAfterCancel,
    actorId: item.actorId,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
  };
};
