const toPlain = (value) => (value?.toObject ? value.toObject() : value);

export const toCharityDto = (charity) => {
  if (!charity) {
    return null;
  }

  const item = toPlain(charity);

  return {
    id: item.id || item._id?.toString(),
    code: item.code,
    name: item.name,
    mission: item.mission,
    website: item.website,
    currency: item.currency,
    supportedCurrencies: item.supportedCurrencies || [],
    totalRaised: item.totalRaised,
    totalRaisedMajor: item.totalRaisedMajor,
    isFeatured: item.isFeatured,
    status: item.status,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const toCharitySelectionDto = (selection) => {
  if (!selection) {
    return null;
  }

  const item = toPlain(selection);

  return {
    id: item.id || item._id?.toString(),
    userId: item.userId,
    charityId: item.charityId,
    currency: item.currency,
    status: item.status,
    effectiveFrom: item.effectiveFrom,
    effectiveTo: item.effectiveTo,
    changedBy: item.changedBy,
    reason: item.reason,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const toContributionRuleDto = (rule) => {
  if (!rule) {
    return null;
  }

  const item = toPlain(rule);

  return {
    id: item.id || item._id?.toString(),
    ruleKey: item.ruleKey,
    currency: item.currency,
    gatewayFeePercentage: item.gatewayFeePercentage,
    prizePoolPercentage: item.prizePoolPercentage,
    mandatoryCharityPercentage: item.mandatoryCharityPercentage,
    status: item.status,
    effectiveFrom: item.effectiveFrom,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const toDonationDto = (donation) => {
  if (!donation) {
    return null;
  }

  const item = toPlain(donation);

  return {
    id: item.id || item._id?.toString(),
    userId: item.userId,
    charityId: item.charityId,
    paymentId: item.paymentId,
    paymentIntentId: item.paymentIntentId,
    subscriptionId: item.subscriptionId,
    source: item.source,
    currency: item.currency,
    amountMinor: item.amountMinor,
    amountMajor: item.amountMajor,
    status: item.status,
    finalizedAt: item.finalizedAt,
    userMessage: item.userMessage,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const toAllocationLedgerDto = (entry) => {
  if (!entry) {
    return null;
  }

  const item = toPlain(entry);

  return {
    id: item.id || item._id?.toString(),
    idempotencyKey: item.idempotencyKey,
    paymentId: item.paymentId,
    userId: item.userId,
    charityId: item.charityId,
    subscriptionId: item.subscriptionId,
    donationId: item.donationId,
    entryType: item.entryType,
    direction: item.direction,
    currency: item.currency,
    amountMinor: item.amountMinor,
    amountMajor: item.amountMajor,
    percentageApplied: item.percentageApplied,
    occurredAt: item.occurredAt,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
  };
};

export const toPayoutLedgerDto = (entry) => {
  if (!entry) {
    return null;
  }

  const item = toPlain(entry);

  return {
    id: item.id || item._id?.toString(),
    charityId: item.charityId,
    entryType: item.entryType,
    status: item.status,
    currency: item.currency,
    amountMinor: item.amountMinor,
    amountMajor: item.amountMajor,
    externalReference: item.externalReference,
    notes: item.notes,
    createdBy: item.createdBy,
    processedBy: item.processedBy,
    processedAt: item.processedAt,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};
