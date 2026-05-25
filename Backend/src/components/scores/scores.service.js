import { AppError, ConflictError, DomainError } from "../../errors/index.js";
import { logAuditEvent } from "../../services/index.js";
import {
  buildPaginationMeta,
  resolvePagination,
  resolveSorting,
} from "../../utils/index.js";

import { toScoreDto } from "./scores.dto.js";
import {
  SCORES_COMPETITION_RULES,
  SCORES_ELIGIBILITY_REASONS,
  SCORES_STATUSES,
  SCORE_SOURCES,
} from "./scores.enums.js";

import { scoresRepository } from "./scores.repository.js";

const SCORE_TIMEZONE = "Asia/Kolkata";

const nowDate = () => new Date();

const istDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: SCORE_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const toISTDateKey = (value) => {
  return istDateFormatter.format(new Date(value));
};

const isFuturePlayedDate = (playedDate, referenceDate) => {
  const playedDateKey = toISTDateKey(playedDate);
  const referenceDateKey = toISTDateKey(referenceDate);

  return playedDateKey > referenceDateKey;
};

const computeBackdatedFlag = (playedDate, submissionDate) => {
  const playedDateKey = toISTDateKey(playedDate);
  const submissionDateKey = toISTDateKey(submissionDate);

  return {
    playedDateKey,
    submissionDateKey,
    isBackdated: playedDateKey < submissionDateKey,
  };
};

const isQualifyingCompetitionScore = (score) => {
  return score.status === SCORES_STATUSES.ACTIVE && !score.isBackdated;
};

const sortBySubmissionTimestampDesc = (left, right) => {
  const leftTimestamp = new Date(
    left.submittedAt || left.createdAt || 0,
  ).getTime();
  const rightTimestamp = new Date(
    right.submittedAt || right.createdAt || 0,
  ).getTime();

  if (leftTimestamp === rightTimestamp) {
    const leftCreated = new Date(left.createdAt || 0).getTime();
    const rightCreated = new Date(right.createdAt || 0).getTime();
    return rightCreated - leftCreated;
  }

  return rightTimestamp - leftTimestamp;
};

const duplicateContestNumbersFromScores = (scores = []) => {
  const seen = new Set();
  const duplicates = new Set();

  for (const score of scores) {
    const contestNumber = Number(score.contestNumber);

    if (seen.has(contestNumber)) {
      duplicates.add(contestNumber);
      continue;
    }

    seen.add(contestNumber);
  }

  return [...duplicates].sort((a, b) => a - b);
};

const assertContestNumberUniqueness = (scores) => {
  const duplicates = duplicateContestNumbersFromScores(scores);

  if (duplicates.length > 0) {
    throw new ConflictError(
      "Duplicate contest numbers are not allowed within the latest five qualifying competition scores.",
      {
        duplicateContestNumbers: duplicates,
      },
    );
  }
};

const buildCompetitionWindowForCandidate = ({
  candidateScore,
  existingQualifyingScores,
  limit = SCORES_COMPETITION_RULES.QUALIFYING_WINDOW_SIZE,
}) => {
  const merged = [candidateScore, ...(existingQualifyingScores || [])]
    .sort(sortBySubmissionTimestampDesc)
    .slice(0, limit);

  return merged;
};

const assertContestRulesForProspectiveScore = async ({
  userId,
  candidateScore,
  excludeScoreId = null,
}) => {
  if (!isQualifyingCompetitionScore(candidateScore)) {
    return;
  }

  const existingQualifyingScores = await scoresRepository.listQualifyingByUser(
    userId,
    {
      excludeScoreId,
      limit: SCORES_COMPETITION_RULES.QUALIFYING_WINDOW_SIZE,
    },
  );

  const windowScores = buildCompetitionWindowForCandidate({
    candidateScore,
    existingQualifyingScores,
  });

  assertContestNumberUniqueness(windowScores);
};

const buildEligibilityPayload = async (userId) => {
  const [latestQualifyingScores, totalQualifyingSubmissions] =
    await Promise.all([
      scoresRepository.listQualifyingByUser(userId, {
        limit: SCORES_COMPETITION_RULES.QUALIFYING_WINDOW_SIZE,
      }),
      scoresRepository.countQualifyingByUser(userId),
    ]);

  const duplicateContestNumbers = duplicateContestNumbersFromScores(
    latestQualifyingScores,
  );
  const reasons = [];

  if (
    latestQualifyingScores.length <
    SCORES_COMPETITION_RULES.QUALIFYING_WINDOW_SIZE
  ) {
    reasons.push(SCORES_ELIGIBILITY_REASONS.INSUFFICIENT_QUALIFYING_SCORES);
  }

  if (duplicateContestNumbers.length > 0) {
    reasons.push(SCORES_ELIGIBILITY_REASONS.DUPLICATE_CONTEST_NUMBERS);
  }

  return {
    rule: {
      qualifyingWindowSize: SCORES_COMPETITION_RULES.QUALIFYING_WINDOW_SIZE,
      ordering: "submittedAt_desc",
      excludedFromQualifying: ["backdated_scores", "non_active_scores"],
    },
    scores: latestQualifyingScores.map(toScoreDto),
    qualifyingCount: latestQualifyingScores.length,
    totalQualifyingSubmissions,
    duplicateContestNumbers,
    isEligible:
      latestQualifyingScores.length ===
        SCORES_COMPETITION_RULES.QUALIFYING_WINDOW_SIZE &&
      duplicateContestNumbers.length === 0,
    reasons,
    generatedAt: nowDate(),
  };
};

const toUpdatableAdminFields = (payload) => {
  const updatable = {};

  if (payload.playedDate !== undefined) {
    updatable.playedDate = payload.playedDate;
  }

  if (payload.value !== undefined) {
    updatable.value = payload.value;
  }

  if (payload.contestNumber !== undefined) {
    updatable.contestNumber = payload.contestNumber;
  }

  if (payload.status !== undefined) {
    updatable.status = payload.status;
  }

  if (payload.metadata !== undefined) {
    updatable.metadata = payload.metadata;
  }

  return updatable;
};

export const scoresService = {
  async listHistoryForUser(userId, query = {}) {
    const pagination = resolvePagination(query);
    const sorting = resolveSorting(
      {
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
      {
        allowedFields: [
          "submittedAt",
          "playedDate",
          "value",
          "contestNumber",
          "createdAt",
        ],
        defaultSortBy: "submittedAt",
        defaultSortOrder: "desc",
      },
    );

    const filter = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.includeBackdated === false) {
      filter.isBackdated = false;
    }

    if (query.contestNumber !== undefined) {
      filter.contestNumber = query.contestNumber;
    }

    const [records, totalItems] = await Promise.all([
      scoresRepository.listByUserPaginated(userId, {
        filter,
        skip: pagination.skip,
        limit: pagination.limit,
        sort: sorting.mongoSort,
      }),
      scoresRepository.countByUser(userId, { filter }),
    ]);

    return {
      items: records.map(toScoreDto),
      meta: buildPaginationMeta({
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalItems,
      }),
    };
  },

  async getForUser(userId, id) {
    const record = await scoresRepository.findByUserAndId(userId, id);

    if (!record) {
      throw AppError.notFound("Score record not found.");
    }

    return toScoreDto(record);
  },

  async createForUser(userId, payload, requestContext = {}) {
    const submissionDate = nowDate();

    if (isFuturePlayedDate(payload.playedDate, submissionDate)) {
      throw new DomainError(
        "Future played dates are not allowed for score submissions.",
      );
    }

    const backdatedInfo = computeBackdatedFlag(
      payload.playedDate,
      submissionDate,
    );

    const createPayload = {
      userId,
      playedDate: payload.playedDate,
      playedDateKey: backdatedInfo.playedDateKey,
      value: payload.value,
      contestNumber: payload.contestNumber,
      status: SCORES_STATUSES.ACTIVE,
      source: SCORE_SOURCES.USER,
      submittedAt: submissionDate,
      submissionLocalDateKey: backdatedInfo.submissionDateKey,
      isBackdated: backdatedInfo.isBackdated,
      confirmedAt: submissionDate,
      confirmedBy: userId,
      metadata: payload.metadata || {},
    };

    await assertContestRulesForProspectiveScore({
      userId,
      candidateScore: createPayload,
    });

    const created = await scoresRepository.create(createPayload);

    logAuditEvent({
      action: "scores.create",
      actorId: userId,
      actorRole: requestContext.role,
      entity: "Score",
      entityId: created.id,
      requestId: requestContext.requestId,
      metadata: {
        contestNumber: created.contestNumber,
        value: created.value,
        isBackdated: created.isBackdated,
      },
    });

    return toScoreDto(created);
  },

  async updateForUser(userId, id, payload) {
    const existing = await scoresRepository.findByUserAndId(userId, id);

    if (!existing) {
      throw AppError.notFound("Score record not found.");
    }

    throw AppError.forbidden(
      "User-submitted scores are immutable after confirmation. Please contact an admin for corrections.",
    );
  },

  async adminUpdateScore(scoreId, payload, requestContext = {}) {
    const existing = await scoresRepository.findById(scoreId);

    if (!existing) {
      throw AppError.notFound("Score record not found.");
    }

    const updatableFields = toUpdatableAdminFields(payload);
    const nextPlayedDate = updatableFields.playedDate || existing.playedDate;
    const now = nowDate();

    if (isFuturePlayedDate(nextPlayedDate, now)) {
      throw new DomainError(
        "Future played dates are not allowed for score submissions.",
      );
    }

    const backdatedInfo = computeBackdatedFlag(
      nextPlayedDate,
      existing.submittedAt || existing.createdAt,
    );

    const candidateScore = {
      ...(existing.toObject ? existing.toObject() : existing),
      ...updatableFields,
      playedDate: nextPlayedDate,
      playedDateKey: backdatedInfo.playedDateKey,
      isBackdated: backdatedInfo.isBackdated,
      submittedAt: existing.submittedAt || existing.createdAt,
      status: updatableFields.status || existing.status,
    };

    await assertContestRulesForProspectiveScore({
      userId: existing.userId,
      candidateScore,
      excludeScoreId: existing.id || scoreId,
    });

    const updatePayload = {
      ...updatableFields,
      playedDate: nextPlayedDate,
      playedDateKey: backdatedInfo.playedDateKey,
      isBackdated: backdatedInfo.isBackdated,
      lastAdminEditedAt: now,
      lastAdminEditedBy: requestContext.actorId || null,
      lastAdminEditReason: payload.editReason,
      adminEditCount: Number(existing.adminEditCount || 0) + 1,
    };

    const updated = await scoresRepository.updateById(scoreId, updatePayload);

    const before = toScoreDto(existing);
    const after = toScoreDto(updated);

    logAuditEvent({
      action: "scores.admin.update",
      actorId: requestContext.actorId,
      actorRole: requestContext.role,
      entity: "Score",
      entityId: existing.id || scoreId,
      requestId: requestContext.requestId,
      metadata: {
        editReason: payload.editReason,
        before,
        after,
      },
    });

    return after;
  },

  async getCompetitionQualifyingScoresForUser(userId) {
    const eligibility = await buildEligibilityPayload(userId);

    return {
      ...eligibility,
      summary: {
        qualifyingCount: eligibility.qualifyingCount,
        requiredQualifyingCount:
          SCORES_COMPETITION_RULES.QUALIFYING_WINDOW_SIZE,
        isEligible: eligibility.isEligible,
      },
    };
  },

  async getCompetitionEligibilityForUser(userId) {
    return buildEligibilityPayload(userId);
  },
};
