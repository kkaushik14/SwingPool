import { randomUUID } from "node:crypto";

import { DAY_IN_MS, DEFAULT_CURRENCY_CODE } from "../../constants/index.js";
import { AppError, ConflictError, DomainError } from "../../errors/index.js";
import { logger } from "../../logger/index.js";
import { logAuditEvent } from "../../services/index.js";
import { fromMinorUnits, toMinorUnits } from "../../utils/index.js";
import { NOTIFICATION_EVENT_TYPES } from "../notifications/notifications.enums.js";
import { dispatchNotificationEvent } from "../notifications/notifications.dispatcher.js";
import { WINNER_PAYOUT_STATUSES } from "../winners/winners.enums.js";
import { winnersRepository } from "../winners/winners.repository.js";

import {
  toDrawConfigDto,
  toDrawDto,
  toDrawEntryDto,
  toDrawSimulationDto,
  toJackpotLedgerDto,
  toPrizePoolDto,
  toPublishedResultDto,
} from "./draws.dto.js";
import {
  DRAW_JACKPOT_LEDGER_DIRECTIONS,
  DRAW_JACKPOT_LEDGER_ENTRY_TYPES,
  DRAW_DEFAULT_CONFIG,
  DRAW_MODES,
  DRAW_PRIZE_POOL_SNAPSHOT_STRATEGIES,
  DRAW_SNAPSHOT_STATUSES,
} from "./draws.enums.js";
import { drawsRepository } from "./draws.repository.js";

const nowDate = () => new Date();
const drawsLogger = logger.child({ scope: "draws" });

const ensureUniqueNumberSet = (numbers = [], { min, max, expectedCount }) => {
  const normalized = numbers.map((value) => Number(value));

  if (normalized.length !== expectedCount) {
    return {
      isValid: false,
      reason: `expected_${expectedCount}_numbers`,
    };
  }

  const seen = new Set();

  for (const number of normalized) {
    if (!Number.isInteger(number)) {
      return {
        isValid: false,
        reason: "non_integer_number",
      };
    }

    if (number < min || number > max) {
      return {
        isValid: false,
        reason: "number_out_of_range",
      };
    }

    if (seen.has(number)) {
      return {
        isValid: false,
        reason: "duplicate_numbers",
      };
    }

    seen.add(number);
  }

  return {
    isValid: true,
    numbers: normalized,
  };
};

const generateRandomUniqueNumbers = ({
  min,
  max,
  count,
  random = Math.random,
}) => {
  const available = [];

  for (let number = min; number <= max; number += 1) {
    available.push(number);
  }

  if (count > available.length) {
    throw new DomainError(
      "numbersPerDraw cannot exceed the available number range length.",
    );
  }

  const selected = [];

  for (let cursor = 0; cursor < count; cursor += 1) {
    const index = Math.floor(random() * available.length);
    selected.push(available[index]);
    available.splice(index, 1);
  }

  return selected.sort((left, right) => left - right);
};

const drawNumberAlgorithms = {
  [DRAW_MODES.RANDOM]: generateRandomUniqueNumbers,
};

const resolveDrawMonthKey = (year, month) => {
  const monthFragment = String(month).padStart(2, "0");
  return `${year}-${monthFragment}`;
};

const calculateMonthRange = (
  year,
  month,
  cutoffDaysBeforeMonthEnd = DRAW_DEFAULT_CONFIG.ELIGIBILITY_CUTOFF_DAYS_BEFORE_MONTH_END,
) => {
  const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const safeCutoffDays = Math.max(
    Number(
      cutoffDaysBeforeMonthEnd ||
        DRAW_DEFAULT_CONFIG.ELIGIBILITY_CUTOFF_DAYS_BEFORE_MONTH_END,
    ),
    1,
  );
  const startDayOfFinalWindow = Math.max(daysInMonth - safeCutoffDays + 1, 1);
  const lastSevenDaysStart = new Date(
    Date.UTC(year, month - 1, startDayOfFinalWindow, 0, 0, 0, 0),
  );

  return {
    monthStart,
    monthEnd,
    daysInMonth,
    lastSevenDaysStart,
    eligibilityCutoffAt: lastSevenDaysStart,
  };
};

const sumDistributionPercentages = (distribution = {}) => {
  return (
    Number(distribution.match3Percentage || 0) +
    Number(distribution.match4Percentage || 0) +
    Number(distribution.match5Percentage || 0)
  );
};

const assertDistributionValid = (distribution = {}) => {
  const total = sumDistributionPercentages(distribution);

  if (Math.abs(total - 100) > 0.0001) {
    throw new DomainError("Prize distribution percentages must total 100.");
  }
};

const ensureDrawMutable = (draw) => {
  if (
    draw.status === DRAW_SNAPSHOT_STATUSES.PUBLISHED ||
    draw.publishedAt ||
    draw.publishedResultId
  ) {
    throw new ConflictError("Published draw snapshots are immutable.");
  }
};

const buildRequestContext = (requestContext = {}) => ({
  actorId: requestContext.actorId || null,
  role: requestContext.role || null,
  requestId: requestContext.requestId || null,
});

const matchCountBetween = (leftNumbers = [], rightNumbers = []) => {
  const winningSet = new Set(rightNumbers.map((value) => Number(value)));
  const matched = [];

  for (const value of leftNumbers) {
    const normalized = Number(value);

    if (winningSet.has(normalized)) {
      matched.push(normalized);
    }
  }

  return {
    count: matched.length,
    matchedNumbers: matched.sort((left, right) => left - right),
  };
};

const allocateBucket = (bucketMinor, winnerCount) => {
  const safeBucketMinor = Math.max(Number(bucketMinor || 0), 0);

  if (winnerCount <= 0) {
    return {
      perWinnerMinor: 0,
      paidMinor: 0,
      remainderMinor: safeBucketMinor,
    };
  }

  const perWinnerMinor = Math.floor(safeBucketMinor / winnerCount);
  const paidMinor = perWinnerMinor * winnerCount;

  return {
    perWinnerMinor,
    paidMinor,
    remainderMinor: Math.max(safeBucketMinor - paidMinor, 0),
  };
};

const dedupeByUserId = (subscriptions = []) => {
  const byUserId = new Map();

  for (const subscription of subscriptions) {
    const userId = String(subscription.userId);

    if (!byUserId.has(userId)) {
      byUserId.set(userId, subscription);
    }
  }

  return [...byUserId.values()];
};

const ensureDrawConfig = async () => {
  const existing = await drawsRepository.getConfig();

  if (existing) {
    assertDistributionValid(existing.prizeDistribution || {});
    return existing;
  }

  const created = await drawsRepository.upsertConfig({
    configKey: "default",
    mode: DRAW_DEFAULT_CONFIG.MODE,
    numberRangeMin: DRAW_DEFAULT_CONFIG.NUMBER_RANGE_MIN,
    numberRangeMax: DRAW_DEFAULT_CONFIG.NUMBER_RANGE_MAX,
    numbersPerDraw: DRAW_DEFAULT_CONFIG.NUMBERS_PER_DRAW,
    eligibilityCutoffDaysBeforeMonthEnd:
      DRAW_DEFAULT_CONFIG.ELIGIBILITY_CUTOFF_DAYS_BEFORE_MONTH_END,
    proofDeadlineDays: DRAW_DEFAULT_CONFIG.PROOF_DEADLINE_DAYS,
    maxProofFiles: DRAW_DEFAULT_CONFIG.MAX_PROOF_FILES,
    prizeDistribution: {
      ...DRAW_DEFAULT_CONFIG.PRIZE_DISTRIBUTION,
    },
    algorithmOptions: {},
    metadata: {},
  });

  assertDistributionValid(created.prizeDistribution || {});

  return created;
};

const resolveSnapshotAt = ({ strategy, monthEnd, drawAt }) => {
  if (strategy === DRAW_PRIZE_POOL_SNAPSHOT_STRATEGIES.MONTH_END) {
    return monthEnd;
  }

  return drawAt;
};

const computeDrawNumbers = ({
  mode,
  numberRangeMin,
  numberRangeMax,
  numbersPerDraw,
}) => {
  const algorithm = drawNumberAlgorithms[mode];

  if (!algorithm) {
    throw new DomainError(
      `Draw mode '${mode}' is not supported in the current engine.`,
    );
  }

  return algorithm({
    min: numberRangeMin,
    max: numberRangeMax,
    count: numbersPerDraw,
  });
};

const createAutomaticEntries = async ({ draw, requestContext }) => {
  const subscriptions = await drawsRepository.findSubscriptionCandidatesForDraw(
    {
      cutoffAt: draw.eligibilityCutoffAt,
      drawAt: draw.drawAt,
    },
  );

  const uniqueSubscriptions = dedupeByUserId(subscriptions);
  const createdEntries = [];
  const skippedUsers = [];

  for (const subscription of uniqueSubscriptions) {
    const subscriptionStartAt = subscription.startAt
      ? new Date(subscription.startAt)
      : null;
    const subscriptionCanceledAt = subscription.canceledAt
      ? new Date(subscription.canceledAt)
      : null;
    const subscriptionEndAt = subscription.endAt
      ? new Date(subscription.endAt)
      : null;

    if (
      !subscriptionStartAt ||
      subscriptionStartAt.getTime() >=
        new Date(draw.eligibilityCutoffAt).getTime()
    ) {
      skippedUsers.push({
        userId: subscription.userId,
        reason: "missed_eligibility_cutoff",
      });
      continue;
    }

    if (String(subscription.status || "").toLowerCase() !== "active") {
      skippedUsers.push({
        userId: subscription.userId,
        reason: "subscription_not_active_on_draw_day",
      });
      continue;
    }

    if (
      (subscriptionCanceledAt &&
        subscriptionCanceledAt.getTime() <= new Date(draw.drawAt).getTime()) ||
      (subscriptionEndAt &&
        subscriptionEndAt.getTime() <= new Date(draw.drawAt).getTime())
    ) {
      skippedUsers.push({
        userId: subscription.userId,
        reason: "lapsed_on_draw_day",
      });
      continue;
    }

    const existingEntry = await drawsRepository.findEntryByDrawAndUser(
      draw.id,
      subscription.userId,
    );

    if (existingEntry) {
      continue;
    }

    const qualifyingScores = await drawsRepository.listQualifyingScoresForUser(
      subscription.userId,
      draw.numbersPerDraw,
    );

    if (qualifyingScores.length < draw.numbersPerDraw) {
      skippedUsers.push({
        userId: subscription.userId,
        reason: "insufficient_qualifying_scores",
      });
      continue;
    }

    const contestNumbers = qualifyingScores.map((score) => Number(score.value));
    const validation = ensureUniqueNumberSet(contestNumbers, {
      min: draw.numberRangeMin,
      max: draw.numberRangeMax,
      expectedCount: draw.numbersPerDraw,
    });

    if (!validation.isValid) {
      skippedUsers.push({
        userId: subscription.userId,
        reason: validation.reason,
      });
      continue;
    }

    try {
      const created = await drawsRepository.createEntry({
        drawId: draw.id,
        userId: subscription.userId,
        subscriptionId: subscription.id,
        contestNumbers: validation.numbers,
        qualifyingScoreIds: qualifyingScores.map((score) => score.id),
        generatedAt: nowDate(),
        metadata: {
          generatedBy: "draw_engine",
        },
      });

      createdEntries.push(created);
    } catch (error) {
      if (error?.code === 11000) {
        continue;
      }

      throw error;
    }
  }

  const totalEntries = await drawsRepository.countEntriesByDraw(draw.id);

  const updatedDraw = await drawsRepository.updateById(draw.id, {
    totalEligibleUsers: uniqueSubscriptions.length,
    totalEntries,
    entriesGeneratedAt: nowDate(),
    status: DRAW_SNAPSHOT_STATUSES.ENTRIES_LOCKED,
    metadata: {
      ...(draw.metadata || {}),
      entryGeneration: {
        generatedAt: nowDate(),
        skippedUsers,
      },
    },
  });

  logAuditEvent({
    action: "draws.entries.generate",
    actorId: requestContext.actorId,
    actorRole: requestContext.role,
    entity: "Draw",
    entityId: draw.id,
    requestId: requestContext.requestId,
    metadata: {
      totalEligibleUsers: uniqueSubscriptions.length,
      totalEntries,
      skippedUsersCount: skippedUsers.length,
    },
  });

  return {
    draw: updatedDraw,
    createdEntries,
    skippedUsers,
    totalEligibleUsers: uniqueSubscriptions.length,
    totalEntries,
  };
};

const finalizePrizePoolAndWinners = async ({
  draw,
  drawConfig,
  publishedResult,
  entries,
  requestContext,
}) => {
  const { monthStart } = calculateMonthRange(draw.year, draw.month);
  const subscriptionPrizePoolMinor =
    await drawsRepository.aggregateMonthlyPrizePoolMinor({
      monthStart,
      snapshotAt: draw.prizePoolSnapshotAt,
    });

  const previousPrizePool = await drawsRepository.findLatestPrizePoolBeforeDate(
    draw.drawAt,
  );
  const jackpotCarryInMinor = Math.max(
    Number(previousPrizePool?.jackpotCarryOutMinor || 0),
    0,
  );

  const manualJackpotAddedMinor =
    await drawsRepository.sumUnappliedManualJackpotCredits();

  if (manualJackpotAddedMinor > 0) {
    await drawsRepository.markManualJackpotCreditsApplied(draw.id);
  }

  const distribution = drawConfig.prizeDistribution || {
    ...DRAW_DEFAULT_CONFIG.PRIZE_DISTRIBUTION,
  };

  assertDistributionValid(distribution);

  const bucket3Minor = Math.round(
    Number(subscriptionPrizePoolMinor || 0) *
      (Number(distribution.match3Percentage || 0) / 100),
  );
  const bucket4Minor = Math.round(
    Number(subscriptionPrizePoolMinor || 0) *
      (Number(distribution.match4Percentage || 0) / 100),
  );

  const bucket5FromSubscriptionMinor = Math.max(
    Number(subscriptionPrizePoolMinor || 0) - bucket3Minor - bucket4Minor,
    0,
  );

  const bucket5Minor =
    bucket5FromSubscriptionMinor +
    jackpotCarryInMinor +
    manualJackpotAddedMinor;

  const winners3 = [];
  const winners4 = [];
  const winners5 = [];

  for (const entry of entries) {
    const matched = matchCountBetween(
      entry.contestNumbers || [],
      publishedResult.winningNumbers || [],
    );

    if (matched.count === 3) {
      winners3.push({ entry, matchedNumbers: matched.matchedNumbers });
      continue;
    }

    if (matched.count === 4) {
      winners4.push({ entry, matchedNumbers: matched.matchedNumbers });
      continue;
    }

    if (matched.count === 5) {
      winners5.push({ entry, matchedNumbers: matched.matchedNumbers });
    }
  }

  const allocation3 = allocateBucket(bucket3Minor, winners3.length);
  const allocation4 = allocateBucket(bucket4Minor, winners4.length);
  const allocation5 = allocateBucket(bucket5Minor, winners5.length);

  const verificationDeadlineAt = new Date(
    new Date(publishedResult.publishedAt).getTime() +
      drawConfig.proofDeadlineDays * DAY_IN_MS,
  );

  const winnersPayload = [];

  for (const candidate of winners3) {
    winnersPayload.push({
      drawId: draw.id,
      publishedResultId: publishedResult.id,
      entryId: candidate.entry.id,
      userId: candidate.entry.userId,
      matchCount: 3,
      contestNumbers: candidate.entry.contestNumbers,
      matchedNumbers: candidate.matchedNumbers,
      prizeAmountMinor: allocation3.perWinnerMinor,
      prizeAmountMajor: fromMinorUnits(allocation3.perWinnerMinor, 2),
      payoutStatus: WINNER_PAYOUT_STATUSES.PENDING_VERIFICATION,
      verificationDeadlineAt,
      metadata: {
        source: "draw_publish",
      },
    });
  }

  for (const candidate of winners4) {
    winnersPayload.push({
      drawId: draw.id,
      publishedResultId: publishedResult.id,
      entryId: candidate.entry.id,
      userId: candidate.entry.userId,
      matchCount: 4,
      contestNumbers: candidate.entry.contestNumbers,
      matchedNumbers: candidate.matchedNumbers,
      prizeAmountMinor: allocation4.perWinnerMinor,
      prizeAmountMajor: fromMinorUnits(allocation4.perWinnerMinor, 2),
      payoutStatus: WINNER_PAYOUT_STATUSES.PENDING_VERIFICATION,
      verificationDeadlineAt,
      metadata: {
        source: "draw_publish",
      },
    });
  }

  for (const candidate of winners5) {
    winnersPayload.push({
      drawId: draw.id,
      publishedResultId: publishedResult.id,
      entryId: candidate.entry.id,
      userId: candidate.entry.userId,
      matchCount: 5,
      contestNumbers: candidate.entry.contestNumbers,
      matchedNumbers: candidate.matchedNumbers,
      prizeAmountMinor: allocation5.perWinnerMinor,
      prizeAmountMajor: fromMinorUnits(allocation5.perWinnerMinor, 2),
      payoutStatus: WINNER_PAYOUT_STATUSES.PENDING_VERIFICATION,
      verificationDeadlineAt,
      metadata: {
        source: "draw_publish",
      },
    });
  }

  if (winnersPayload.length > 0) {
    await winnersRepository.createMany(winnersPayload);
  }

  const jackpotCarryOutMinor =
    winners5.length > 0 ? allocation5.remainderMinor : bucket5Minor;
  const unused3ToRevenueMinor =
    winners3.length > 0 ? allocation3.remainderMinor : bucket3Minor;
  const unused4ToRevenueMinor =
    winners4.length > 0 ? allocation4.remainderMinor : bucket4Minor;

  const companyRevenueMinor = unused3ToRevenueMinor + unused4ToRevenueMinor;

  const prizePool = await drawsRepository.createPrizePool({
    drawId: draw.id,
    currency: DEFAULT_CURRENCY_CODE,
    snapshotAt: draw.prizePoolSnapshotAt,
    subscriptionPrizePoolMinor,
    manualJackpotAddedMinor,
    jackpotCarryInMinor,
    bucket3Minor,
    bucket4Minor,
    bucket5Minor,
    winners3Count: winners3.length,
    winners4Count: winners4.length,
    winners5Count: winners5.length,
    match3PaidMinor: allocation3.paidMinor,
    match4PaidMinor: allocation4.paidMinor,
    match5PaidMinor: winners5.length > 0 ? allocation5.paidMinor : 0,
    unused3ToRevenueMinor,
    unused4ToRevenueMinor,
    companyRevenueMinor,
    jackpotCarryOutMinor,
    finalizedAt: nowDate(),
    metadata: {
      distribution,
      winnersCreated: winnersPayload.length,
    },
  });

  if (jackpotCarryInMinor + manualJackpotAddedMinor > 0) {
    await drawsRepository.createJackpotLedgerEntry({
      idempotencyKey: `draw:${draw.id}:rollover_in`,
      drawId: draw.id,
      appliedDrawId: draw.id,
      entryType: DRAW_JACKPOT_LEDGER_ENTRY_TYPES.ROLLOVER_IN,
      direction: DRAW_JACKPOT_LEDGER_DIRECTIONS.CREDIT,
      amountMinor: jackpotCarryInMinor + manualJackpotAddedMinor,
      currency: DEFAULT_CURRENCY_CODE,
      occurredAt: nowDate(),
      notes: "Opening jackpot balance for published draw.",
      createdBy: requestContext.actorId,
      metadata: {},
    });
  }

  if (winners5.length > 0 && allocation5.paidMinor > 0) {
    await drawsRepository.createJackpotLedgerEntry({
      idempotencyKey: `draw:${draw.id}:jackpot_payout`,
      drawId: draw.id,
      appliedDrawId: draw.id,
      entryType: DRAW_JACKPOT_LEDGER_ENTRY_TYPES.JACKPOT_PAYOUT,
      direction: DRAW_JACKPOT_LEDGER_DIRECTIONS.DEBIT,
      amountMinor: allocation5.paidMinor,
      currency: DEFAULT_CURRENCY_CODE,
      occurredAt: nowDate(),
      notes: "5-match jackpot payout on draw publication.",
      createdBy: requestContext.actorId,
      metadata: {},
    });
  }

  if (jackpotCarryOutMinor > 0) {
    await drawsRepository.createJackpotLedgerEntry({
      idempotencyKey: `draw:${draw.id}:rollover_out`,
      drawId: draw.id,
      appliedDrawId: draw.id,
      entryType: DRAW_JACKPOT_LEDGER_ENTRY_TYPES.ROLLOVER_OUT,
      direction: DRAW_JACKPOT_LEDGER_DIRECTIONS.CREDIT,
      amountMinor: jackpotCarryOutMinor,
      currency: DEFAULT_CURRENCY_CODE,
      occurredAt: nowDate(),
      notes: "Unclaimed jackpot rollover to next draw.",
      createdBy: requestContext.actorId,
      metadata: {},
    });
  }

  return prizePool;
};

export const drawsService = {
  async getConfig() {
    const config = await ensureDrawConfig();
    return toDrawConfigDto(config);
  },

  async updateConfig(payload, requestContext = {}) {
    const existingConfig = await ensureDrawConfig();
    const effectiveDistribution =
      payload.prizeDistribution || existingConfig.prizeDistribution || {};
    assertDistributionValid(effectiveDistribution);

    const context = buildRequestContext(requestContext);
    const updated = await drawsRepository.upsertConfig({
      ...payload,
      updatedBy: context.actorId,
    });

    logAuditEvent({
      action: "draws.config.update",
      actorId: context.actorId,
      actorRole: context.role,
      entity: "DrawConfig",
      entityId: updated.id,
      requestId: context.requestId,
      metadata: {
        updatedFields: Object.keys(payload),
      },
    });

    return toDrawConfigDto(updated);
  },

  async createSnapshot(payload, requestContext = {}) {
    const drawConfig = await ensureDrawConfig();
    const drawMonthKey = resolveDrawMonthKey(payload.year, payload.month);
    const existing = await drawsRepository.findByMonthKey(drawMonthKey);

    if (existing) {
      throw new ConflictError(
        `Draw snapshot for '${drawMonthKey}' already exists.`,
      );
    }

    const monthRange = calculateMonthRange(
      payload.year,
      payload.month,
      drawConfig.eligibilityCutoffDaysBeforeMonthEnd,
    );
    const drawAt = payload.drawAt || monthRange.monthEnd;

    if (drawAt < monthRange.monthStart || drawAt > monthRange.monthEnd) {
      throw new DomainError("drawAt must be within the target month.");
    }

    const mode = payload.mode || drawConfig.mode || DRAW_MODES.RANDOM;
    const snapshotStrategy =
      payload.prizePoolSnapshotStrategy ||
      DRAW_PRIZE_POOL_SNAPSHOT_STRATEGIES.DRAW_DAY;

    const created = await drawsRepository.create({
      drawMonthKey,
      month: payload.month,
      year: payload.year,
      mode,
      drawAt,
      eligibilityCutoffAt: monthRange.eligibilityCutoffAt,
      prizePoolSnapshotAt: resolveSnapshotAt({
        strategy: snapshotStrategy,
        monthEnd: monthRange.monthEnd,
        drawAt,
      }),
      numbersPerDraw: drawConfig.numbersPerDraw,
      numberRangeMin: drawConfig.numberRangeMin,
      numberRangeMax: drawConfig.numberRangeMax,
      status: DRAW_SNAPSHOT_STATUSES.DRAFT,
      metadata: {
        snapshotStrategy,
        createdWithConfigVersionAt: drawConfig.updatedAt,
      },
    });

    const context = buildRequestContext(requestContext);

    logAuditEvent({
      action: "draws.snapshot.create",
      actorId: context.actorId,
      actorRole: context.role,
      entity: "Draw",
      entityId: created.id,
      requestId: context.requestId,
      metadata: {
        drawMonthKey,
        mode,
      },
    });

    return toDrawDto(created);
  },

  async listAll() {
    const records = await drawsRepository.findMany();
    return records.map(toDrawDto);
  },

  async getById(id) {
    const record = await drawsRepository.findById(id);

    if (!record) {
      throw AppError.notFound("Draw snapshot not found.");
    }

    return toDrawDto(record);
  },

  async updateSnapshot(id, payload, requestContext = {}) {
    const existing = await drawsRepository.findById(id);

    if (!existing) {
      throw AppError.notFound("Draw snapshot not found.");
    }

    ensureDrawMutable(existing);

    const updated = await drawsRepository.updateById(id, {
      ...payload,
    });

    const context = buildRequestContext(requestContext);

    logAuditEvent({
      action: "draws.snapshot.update",
      actorId: context.actorId,
      actorRole: context.role,
      entity: "Draw",
      entityId: id,
      requestId: context.requestId,
      metadata: {
        updatedFields: Object.keys(payload),
      },
    });

    return toDrawDto(updated);
  },

  async generateEntries(drawId, requestContext = {}) {
    const draw = await drawsRepository.findById(drawId);

    if (!draw) {
      throw AppError.notFound("Draw snapshot not found.");
    }

    ensureDrawMutable(draw);

    const context = buildRequestContext(requestContext);
    const generation = await createAutomaticEntries({
      draw,
      requestContext: context,
    });

    return {
      draw: toDrawDto(generation.draw),
      createdEntries: generation.createdEntries.map(toDrawEntryDto),
      skippedUsers: generation.skippedUsers,
      totalEligibleUsers: generation.totalEligibleUsers,
      totalEntries: generation.totalEntries,
    };
  },

  async listEntries(drawId) {
    const draw = await drawsRepository.findById(drawId);

    if (!draw) {
      throw AppError.notFound("Draw snapshot not found.");
    }

    const entries = await drawsRepository.listEntriesByDraw(drawId);
    return entries.map(toDrawEntryDto);
  },

  async runSimulation(drawId, payload = {}, requestContext = {}) {
    const draw = await drawsRepository.findById(drawId);

    if (!draw) {
      throw AppError.notFound("Draw snapshot not found.");
    }

    const entries = await drawsRepository.listEntriesByDraw(drawId);

    if (entries.length === 0) {
      await createAutomaticEntries({
        draw,
        requestContext: buildRequestContext(requestContext),
      });
    }

    const refreshedEntries = await drawsRepository.listEntriesByDraw(drawId);

    const winningNumbers = computeDrawNumbers({
      mode: draw.mode,
      numberRangeMin: draw.numberRangeMin,
      numberRangeMax: draw.numberRangeMax,
      numbersPerDraw: draw.numbersPerDraw,
    });

    let match3Count = 0;
    let match4Count = 0;
    let match5Count = 0;

    for (const entry of refreshedEntries) {
      const match = matchCountBetween(
        entry.contestNumbers || [],
        winningNumbers,
      );

      if (match.count === 3) {
        match3Count += 1;
      }

      if (match.count === 4) {
        match4Count += 1;
      }

      if (match.count === 5) {
        match5Count += 1;
      }
    }

    const simulation = await drawsRepository.createSimulation({
      drawId,
      mode: draw.mode,
      winningNumbers,
      winnerStats: {
        match3Count,
        match4Count,
        match5Count,
      },
      jackpotWouldRollOver: match5Count === 0,
      requestedBy: requestContext.actorId || null,
      requestedAt: nowDate(),
      notes: payload.notes || "",
      metadata: payload.metadata || {},
    });

    return toDrawSimulationDto(simulation);
  },

  async listSimulations(drawId) {
    const draw = await drawsRepository.findById(drawId);

    if (!draw) {
      throw AppError.notFound("Draw snapshot not found.");
    }

    const simulations = await drawsRepository.listSimulationsByDraw(drawId);
    return simulations.map(toDrawSimulationDto);
  },

  async publishDraw(drawId, requestContext = {}) {
    const draw = await drawsRepository.findById(drawId);

    if (!draw) {
      throw AppError.notFound("Draw snapshot not found.");
    }

    ensureDrawMutable(draw);

    const drawConfig = await ensureDrawConfig();
    const context = buildRequestContext(requestContext);

    const entriesBeforePublish =
      await drawsRepository.listEntriesByDraw(drawId);

    if (entriesBeforePublish.length === 0) {
      await createAutomaticEntries({ draw, requestContext: context });
    }

    const entries = await drawsRepository.listEntriesByDraw(drawId);

    const winningNumbers = computeDrawNumbers({
      mode: draw.mode,
      numberRangeMin: draw.numberRangeMin,
      numberRangeMax: draw.numberRangeMax,
      numbersPerDraw: draw.numbersPerDraw,
    });

    const publishedResult = await drawsRepository.createPublishedResult({
      drawId,
      mode: draw.mode,
      winningNumbers,
      publishedBy: context.actorId,
      publishedAt: nowDate(),
      metadata: {
        entryCount: entries.length,
      },
    });

    const prizePool = await finalizePrizePoolAndWinners({
      draw,
      drawConfig,
      publishedResult,
      entries,
      requestContext: context,
    });

    const updatedDraw = await drawsRepository.updateById(drawId, {
      status: DRAW_SNAPSHOT_STATUSES.PUBLISHED,
      publishedAt: publishedResult.publishedAt,
      publishedResultId: publishedResult.id,
      prizePoolId: prizePool.id,
      totalEntries: entries.length,
      metadata: {
        ...(draw.metadata || {}),
        publication: {
          publishedAt: publishedResult.publishedAt,
          winnerCountEstimated:
            prizePool.winners3Count +
            prizePool.winners4Count +
            prizePool.winners5Count,
        },
      },
    });

    logAuditEvent({
      action: "draws.publish",
      actorId: context.actorId,
      actorRole: context.role,
      entity: "Draw",
      entityId: drawId,
      requestId: context.requestId,
      metadata: {
        winningNumbers,
        totalEntries: entries.length,
        prizePoolId: prizePool.id,
      },
    });

    const participantsByUserId = [
      ...new Set(entries.map((item) => String(item.userId))),
    ];

    for (const userId of participantsByUserId) {
      dispatchNotificationEvent({
        scope: "draws",
        userId,
        eventType: NOTIFICATION_EVENT_TYPES.DRAW_PUBLISHED,
        context: {
          drawId,
          drawMonthKey: draw.drawMonthKey,
          winningNumbers,
        },
        dedupeKey: `draw:${drawId}:published:user:${userId}`,
        requestContext: context,
      });
    }

    void winnersRepository
      .findMany({ drawId })
      .then((winners) => {
        for (const winner of winners) {
          dispatchNotificationEvent({
            scope: "draws",
            userId: winner.userId,
            eventType: NOTIFICATION_EVENT_TYPES.WINNER_SELECTED,
            context: {
              drawId,
              winnerId: winner.id,
              matchCount: winner.matchCount,
              prizeAmountMajor: winner.prizeAmountMajor,
              verificationDeadlineAt: winner.verificationDeadlineAt,
            },
            dedupeKey: `winner:${winner.id}:selected`,
            requestContext: context,
          });
        }
      })
      .catch((error) => {
        drawsLogger.warn(
          {
            requestId: context.requestId || null,
            drawId,
            error: error.message,
          },
          "Failed to resolve winners for post-publish notification dispatch",
        );
      });

    return {
      draw: toDrawDto(updatedDraw),
      result: toPublishedResultDto(publishedResult),
      prizePool: toPrizePoolDto(prizePool),
    };
  },

  async getPublishedResult(drawId) {
    const draw = await drawsRepository.findById(drawId);

    if (!draw) {
      throw AppError.notFound("Draw snapshot not found.");
    }

    const result = await drawsRepository.findPublishedResultByDrawId(drawId);

    if (!result) {
      throw AppError.notFound("Published draw result not found.");
    }

    return toPublishedResultDto(result);
  },

  async getPrizePool(drawId) {
    const draw = await drawsRepository.findById(drawId);

    if (!draw) {
      throw AppError.notFound("Draw snapshot not found.");
    }

    const prizePool = await drawsRepository.findPrizePoolByDrawId(drawId);

    if (!prizePool) {
      throw AppError.notFound("Prize pool snapshot not found for this draw.");
    }

    return toPrizePoolDto(prizePool);
  },

  async addManualJackpotFund(payload, requestContext = {}) {
    const amountMinor = toMinorUnits(payload.amountInr, 2);

    if (amountMinor <= 0) {
      throw new DomainError("Manual jackpot amount must be greater than zero.");
    }

    const context = buildRequestContext(requestContext);

    const created = await drawsRepository.createJackpotLedgerEntry({
      idempotencyKey: `manual-jackpot-fund:${randomUUID()}`,
      drawId: null,
      appliedDrawId: null,
      entryType: DRAW_JACKPOT_LEDGER_ENTRY_TYPES.MANUAL_FUND,
      direction: DRAW_JACKPOT_LEDGER_DIRECTIONS.CREDIT,
      amountMinor,
      currency: DEFAULT_CURRENCY_CODE,
      occurredAt: nowDate(),
      notes: payload.notes || "",
      createdBy: context.actorId,
      metadata: payload.metadata || {},
    });

    logAuditEvent({
      action: "draws.jackpot.manual_fund",
      actorId: context.actorId,
      actorRole: context.role,
      entity: "DrawJackpotLedger",
      entityId: created.id,
      requestId: context.requestId,
      metadata: {
        amountMinor,
      },
    });

    return toJackpotLedgerDto(created);
  },

  async listJackpotLedger() {
    const records = await drawsRepository.listJackpotLedger();
    return records.map(toJackpotLedgerDto);
  },

  generateRandomUniqueNumbers,
};
