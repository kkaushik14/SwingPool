const toPlain = (value) => (value?.toObject ? value.toObject() : value);

export const toDrawConfigDto = (config) => {
  if (!config) {
    return null;
  }

  const item = toPlain(config);

  return {
    id: item.id || item._id?.toString(),
    configKey: item.configKey,
    mode: item.mode,
    numberRangeMin: item.numberRangeMin,
    numberRangeMax: item.numberRangeMax,
    numbersPerDraw: item.numbersPerDraw,
    eligibilityCutoffDaysBeforeMonthEnd:
      item.eligibilityCutoffDaysBeforeMonthEnd,
    proofDeadlineDays: item.proofDeadlineDays,
    maxProofFiles: item.maxProofFiles,
    prizeDistribution: item.prizeDistribution || {},
    algorithmOptions: item.algorithmOptions || {},
    metadata: item.metadata || {},
    updatedBy: item.updatedBy,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const toDrawDto = (draw) => {
  if (!draw) {
    return null;
  }

  const item = toPlain(draw);

  return {
    id: item.id || item._id?.toString(),
    drawMonthKey: item.drawMonthKey,
    month: item.month,
    year: item.year,
    mode: item.mode,
    drawAt: item.drawAt,
    eligibilityCutoffAt: item.eligibilityCutoffAt,
    prizePoolSnapshotAt: item.prizePoolSnapshotAt,
    numberRangeMin: item.numberRangeMin,
    numberRangeMax: item.numberRangeMax,
    numbersPerDraw: item.numbersPerDraw,
    status: item.status,
    entriesGeneratedAt: item.entriesGeneratedAt,
    publishedAt: item.publishedAt,
    publishedResultId: item.publishedResultId,
    prizePoolId: item.prizePoolId,
    totalEligibleUsers: item.totalEligibleUsers,
    totalEntries: item.totalEntries,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const toDrawEntryDto = (entry) => {
  if (!entry) {
    return null;
  }

  const item = toPlain(entry);

  return {
    id: item.id || item._id?.toString(),
    drawId: item.drawId,
    userId: item.userId,
    subscriptionId: item.subscriptionId,
    source: item.source,
    contestNumbers: item.contestNumbers || [],
    qualifyingScoreIds: item.qualifyingScoreIds || [],
    generatedAt: item.generatedAt,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const toDrawSimulationDto = (simulation) => {
  if (!simulation) {
    return null;
  }

  const item = toPlain(simulation);

  return {
    id: item.id || item._id?.toString(),
    drawId: item.drawId,
    mode: item.mode,
    winningNumbers: item.winningNumbers || [],
    winnerStats: item.winnerStats || {},
    jackpotWouldRollOver: item.jackpotWouldRollOver,
    status: item.status,
    requestedBy: item.requestedBy,
    requestedAt: item.requestedAt,
    notes: item.notes,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
  };
};

export const toPublishedResultDto = (result) => {
  if (!result) {
    return null;
  }

  const item = toPlain(result);

  return {
    id: item.id || item._id?.toString(),
    drawId: item.drawId,
    mode: item.mode,
    winningNumbers: item.winningNumbers || [],
    status: item.status,
    publishedBy: item.publishedBy,
    publishedAt: item.publishedAt,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
  };
};

export const toPrizePoolDto = (pool) => {
  if (!pool) {
    return null;
  }

  const item = toPlain(pool);

  return {
    id: item.id || item._id?.toString(),
    drawId: item.drawId,
    currency: item.currency,
    snapshotAt: item.snapshotAt,
    subscriptionPrizePoolMinor: item.subscriptionPrizePoolMinor,
    manualJackpotAddedMinor: item.manualJackpotAddedMinor,
    jackpotCarryInMinor: item.jackpotCarryInMinor,
    bucket3Minor: item.bucket3Minor,
    bucket4Minor: item.bucket4Minor,
    bucket5Minor: item.bucket5Minor,
    winners3Count: item.winners3Count,
    winners4Count: item.winners4Count,
    winners5Count: item.winners5Count,
    match3PaidMinor: item.match3PaidMinor,
    match4PaidMinor: item.match4PaidMinor,
    match5PaidMinor: item.match5PaidMinor,
    unused3ToRevenueMinor: item.unused3ToRevenueMinor,
    unused4ToRevenueMinor: item.unused4ToRevenueMinor,
    companyRevenueMinor: item.companyRevenueMinor,
    jackpotCarryOutMinor: item.jackpotCarryOutMinor,
    finalizedAt: item.finalizedAt,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const toJackpotLedgerDto = (entry) => {
  if (!entry) {
    return null;
  }

  const item = toPlain(entry);

  return {
    id: item.id || item._id?.toString(),
    idempotencyKey: item.idempotencyKey,
    drawId: item.drawId,
    appliedDrawId: item.appliedDrawId,
    entryType: item.entryType,
    direction: item.direction,
    amountMinor: item.amountMinor,
    currency: item.currency,
    occurredAt: item.occurredAt,
    notes: item.notes,
    createdBy: item.createdBy,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};
