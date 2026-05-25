import { AppError, DomainError } from "../../errors/index.js";
import { DEFAULT_CURRENCY_CODE } from "../../constants/index.js";
import { logAuditEvent } from "../../services/index.js";
import { fromMinorUnits } from "../../utils/index.js";
import { drawsRepository } from "../draws/draws.repository.js";
import { NOTIFICATION_EVENT_TYPES } from "../notifications/notifications.enums.js";
import { dispatchNotificationEvent } from "../notifications/notifications.dispatcher.js";

import { toWinnerDto, toWinnerProofSubmissionDto } from "./winners.dto.js";
import {
  WINNER_PAYOUT_STATUSES,
  WINNER_PROOF_SUBMISSION_STATUSES,
} from "./winners.enums.js";
import { winnersRepository } from "./winners.repository.js";

const nowDate = () => new Date();

const buildRequestContext = (requestContext = {}) => ({
  actorId: requestContext.actorId || null,
  role: requestContext.role || null,
  requestId: requestContext.requestId || null,
});

const assertWinnerOwnerOrAdmin = ({
  winner,
  requesterUserId,
  requesterRole,
}) => {
  const isOwner = String(winner.userId) === String(requesterUserId);
  const isAdmin = requesterRole === "admin";

  if (!isOwner && !isAdmin) {
    throw AppError.forbidden(
      "You do not have permission to access this winner record.",
    );
  }
};

const assertProofSubmissionWindowOpen = (winner) => {
  if (!winner.verificationDeadlineAt) {
    throw new DomainError("Winner proof deadline is not configured.");
  }

  if (new Date(winner.verificationDeadlineAt).getTime() < nowDate().getTime()) {
    throw new DomainError(
      "Proof submission window is closed for this winner record.",
    );
  }
};

const assertPayoutTransition = (currentStatus, nextStatus) => {
  if (nextStatus === currentStatus) {
    return;
  }

  const allowedTransitions = {
    [WINNER_PAYOUT_STATUSES.PENDING_VERIFICATION]: [
      WINNER_PAYOUT_STATUSES.APPROVED,
      WINNER_PAYOUT_STATUSES.REJECTED,
    ],
    [WINNER_PAYOUT_STATUSES.APPROVED]: [
      WINNER_PAYOUT_STATUSES.REJECTED,
      WINNER_PAYOUT_STATUSES.PAYOUT_PENDING,
    ],
    [WINNER_PAYOUT_STATUSES.REJECTED]: [
      WINNER_PAYOUT_STATUSES.PENDING_VERIFICATION,
      WINNER_PAYOUT_STATUSES.APPROVED,
    ],
    [WINNER_PAYOUT_STATUSES.PAYOUT_PENDING]: [WINNER_PAYOUT_STATUSES.PAID],
    [WINNER_PAYOUT_STATUSES.PAID]: [],
  };

  const allowed = allowedTransitions[currentStatus] || [];

  if (!allowed.includes(nextStatus)) {
    throw new DomainError(
      `Invalid winner payout transition from '${currentStatus}' to '${nextStatus}'.`,
    );
  }
};

const resolveWinnerPayoutStatusFromProofReview = (proofStatus) => {
  if (proofStatus === WINNER_PROOF_SUBMISSION_STATUSES.APPROVED) {
    return WINNER_PAYOUT_STATUSES.APPROVED;
  }

  if (proofStatus === WINNER_PROOF_SUBMISSION_STATUSES.REJECTED) {
    return WINNER_PAYOUT_STATUSES.REJECTED;
  }

  return WINNER_PAYOUT_STATUSES.PENDING_VERIFICATION;
};

export const winnersService = {
  async listMine(userId) {
    const records = await winnersRepository.listByUserId(userId);
    return records.map(toWinnerDto);
  },

  async getMineById(userId, id) {
    const record = await winnersRepository.findByUserAndId(userId, id);

    if (!record) {
      throw AppError.notFound("Winner record not found.");
    }

    return toWinnerDto(record);
  },

  async adminListAll(query = {}) {
    const filter = {};

    if (query.drawId) {
      filter.drawId = query.drawId;
    }

    if (query.userId) {
      filter.userId = query.userId;
    }

    if (query.payoutStatus) {
      filter.payoutStatus = query.payoutStatus;
    }

    const records = await winnersRepository.findMany(filter);
    return records.map(toWinnerDto);
  },

  async getById(id) {
    const record = await winnersRepository.findById(id);

    if (!record) {
      throw AppError.notFound("Winner record not found.");
    }

    return toWinnerDto(record);
  },

  async create(payload, requestContext = {}) {
    const created = await winnersRepository.create({
      ...payload,
      prizeAmountMajor: fromMinorUnits(payload.prizeAmountMinor, 2),
      payoutStatus: WINNER_PAYOUT_STATUSES.PENDING_VERIFICATION,
      proofSubmissionCount: 0,
      metadata: payload.metadata || {},
    });

    const context = buildRequestContext(requestContext);

    logAuditEvent({
      action: "winners.create",
      actorId: context.actorId,
      actorRole: context.role,
      entity: "Winner",
      entityId: created.id,
      requestId: context.requestId,
      metadata: {
        drawId: created.drawId,
        matchCount: created.matchCount,
      },
    });

    return toWinnerDto(created);
  },

  async submitProof({
    winnerId,
    requesterUserId,
    requesterRole,
    payload,
    requestContext = {},
  }) {
    const winner = await winnersRepository.findById(winnerId);

    if (!winner) {
      throw AppError.notFound("Winner record not found.");
    }

    assertWinnerOwnerOrAdmin({ winner, requesterUserId, requesterRole });

    if (
      ![
        WINNER_PAYOUT_STATUSES.PENDING_VERIFICATION,
        WINNER_PAYOUT_STATUSES.REJECTED,
      ].includes(winner.payoutStatus)
    ) {
      throw new DomainError(
        "Proof submission is not allowed in the current payout state.",
      );
    }

    assertProofSubmissionWindowOpen(winner);

    const drawConfig = await drawsRepository.getConfig();
    const maxProofFiles = Number(drawConfig?.maxProofFiles || 2);

    if (
      !Array.isArray(payload.files) ||
      payload.files.length === 0 ||
      payload.files.length > maxProofFiles
    ) {
      throw new DomainError(
        `Proof submission must include between 1 and ${maxProofFiles} files.`,
      );
    }

    const latest = await winnersRepository.findLatestProofSubmissionForWinner(
      winner.id,
    );
    const nextSubmissionNumber = Number(latest?.submissionNumber || 0) + 1;

    const created = await winnersRepository.createProofSubmission({
      winnerId: winner.id,
      drawId: winner.drawId,
      userId: requesterUserId,
      submissionNumber: nextSubmissionNumber,
      files: payload.files,
      status: WINNER_PROOF_SUBMISSION_STATUSES.SUBMITTED,
      submittedAt: nowDate(),
      metadata: payload.metadata || {},
    });

    const winnerUpdatePayload = {
      latestProofSubmissionId: created.id,
      proofSubmissionCount: Number(winner.proofSubmissionCount || 0) + 1,
      metadata: {
        ...(winner.metadata || {}),
        lastProofSubmittedAt: created.submittedAt,
      },
    };

    if (winner.payoutStatus === WINNER_PAYOUT_STATUSES.REJECTED) {
      winnerUpdatePayload.payoutStatus =
        WINNER_PAYOUT_STATUSES.PENDING_VERIFICATION;
      winnerUpdatePayload.rejectedAt = null;
      winnerUpdatePayload.rejectionReason = "";
    }

    await winnersRepository.updateById(winner.id, winnerUpdatePayload);

    const context = buildRequestContext(requestContext);

    logAuditEvent({
      action: "winners.proof.submit",
      actorId: context.actorId || requesterUserId,
      actorRole: context.role || requesterRole,
      entity: "WinnerProofSubmission",
      entityId: created.id,
      requestId: context.requestId,
      metadata: {
        winnerId: winner.id,
        submissionNumber: nextSubmissionNumber,
      },
    });

    return toWinnerProofSubmissionDto(created);
  },

  async listProofSubmissions({ winnerId, requesterUserId, requesterRole }) {
    const winner = await winnersRepository.findById(winnerId);

    if (!winner) {
      throw AppError.notFound("Winner record not found.");
    }

    assertWinnerOwnerOrAdmin({ winner, requesterUserId, requesterRole });

    const records =
      await winnersRepository.listProofSubmissionsForWinner(winnerId);
    return records.map(toWinnerProofSubmissionDto);
  },

  async reviewProofSubmission({
    winnerId,
    proofId,
    payload,
    requestContext = {},
  }) {
    const winner = await winnersRepository.findById(winnerId);

    if (!winner) {
      throw AppError.notFound("Winner record not found.");
    }

    const proof = await winnersRepository.findProofSubmissionById(proofId);

    if (!proof || String(proof.winnerId) !== String(winner.id)) {
      throw AppError.notFound("Winner proof submission not found.");
    }

    if (proof.status !== WINNER_PROOF_SUBMISSION_STATUSES.SUBMITTED) {
      throw new DomainError("Only submitted proof entries can be reviewed.");
    }

    const context = buildRequestContext(requestContext);

    const updatedProof = await winnersRepository.updateProofSubmissionById(
      proof.id,
      {
        status: payload.status,
        reviewedAt: nowDate(),
        reviewedBy: context.actorId,
        rejectionReason:
          payload.status === WINNER_PROOF_SUBMISSION_STATUSES.REJECTED
            ? payload.rejectionReason || ""
            : "",
        metadata: {
          ...(proof.metadata || {}),
          ...(payload.metadata || {}),
        },
      },
    );

    const winnerNextStatus = resolveWinnerPayoutStatusFromProofReview(
      payload.status,
    );

    assertPayoutTransition(winner.payoutStatus, winnerNextStatus);

    const winnerUpdatePayload = {
      payoutStatus: winnerNextStatus,
      metadata: {
        ...(winner.metadata || {}),
        lastProofReviewAt: nowDate(),
      },
    };

    if (winnerNextStatus === WINNER_PAYOUT_STATUSES.APPROVED) {
      winnerUpdatePayload.approvedAt = nowDate();
      winnerUpdatePayload.rejectedAt = null;
      winnerUpdatePayload.rejectionReason = "";
    }

    if (winnerNextStatus === WINNER_PAYOUT_STATUSES.REJECTED) {
      winnerUpdatePayload.rejectedAt = nowDate();
      winnerUpdatePayload.rejectionReason = payload.rejectionReason || "";
    }

    await winnersRepository.updateById(winner.id, winnerUpdatePayload);

    if (payload.status === WINNER_PROOF_SUBMISSION_STATUSES.REJECTED) {
      dispatchNotificationEvent({
        scope: "winners",
        userId: winner.userId,
        eventType: NOTIFICATION_EVENT_TYPES.PROOF_REJECTED,
        context: {
          winnerId: winner.id,
          proofId: updatedProof.id,
          rejectionReason: payload.rejectionReason || "",
        },
        dedupeKey: `winner:${winner.id}:proof:${updatedProof.id}:rejected`,
        requestContext: context,
      });
    }

    logAuditEvent({
      action: "winners.proof.review",
      actorId: context.actorId,
      actorRole: context.role,
      entity: "WinnerProofSubmission",
      entityId: updatedProof.id,
      requestId: context.requestId,
      metadata: {
        winnerId: winner.id,
        status: payload.status,
      },
    });

    return toWinnerProofSubmissionDto(updatedProof);
  },

  async updatePayoutStatus({ winnerId, payload, requestContext = {} }) {
    const winner = await winnersRepository.findById(winnerId);

    if (!winner) {
      throw AppError.notFound("Winner record not found.");
    }

    assertPayoutTransition(winner.payoutStatus, payload.payoutStatus);

    const context = buildRequestContext(requestContext);
    const updatePayload = {
      payoutStatus: payload.payoutStatus,
      metadata: {
        ...(winner.metadata || {}),
        ...(payload.metadata || {}),
      },
    };

    if (payload.payoutStatus === WINNER_PAYOUT_STATUSES.REJECTED) {
      updatePayload.rejectedAt = nowDate();
      updatePayload.rejectionReason = payload.rejectionReason || "";
    }

    if (payload.payoutStatus === WINNER_PAYOUT_STATUSES.PAYOUT_PENDING) {
      updatePayload.payoutPendingAt = nowDate();
      updatePayload.payoutReference =
        payload.payoutReference || winner.payoutReference || "";
    }

    if (payload.payoutStatus === WINNER_PAYOUT_STATUSES.PAID) {
      updatePayload.paidAt = nowDate();
      updatePayload.payoutReference =
        payload.payoutReference || winner.payoutReference || "";
    }

    if (payload.payoutStatus === WINNER_PAYOUT_STATUSES.APPROVED) {
      updatePayload.approvedAt = nowDate();
      updatePayload.rejectedAt = null;
      updatePayload.rejectionReason = "";
    }

    const updated = await winnersRepository.updateById(
      winner.id,
      updatePayload,
    );

    if (payload.payoutStatus === WINNER_PAYOUT_STATUSES.PAID) {
      dispatchNotificationEvent({
        scope: "winners",
        userId: winner.userId,
        eventType: NOTIFICATION_EVENT_TYPES.PAYOUT_COMPLETED,
        context: {
          winnerId: winner.id,
          amountMajor: winner.prizeAmountMajor,
          currency: DEFAULT_CURRENCY_CODE,
          payoutReference: updatePayload.payoutReference || "",
        },
        dedupeKey: `winner:${winner.id}:payout_paid`,
        requestContext: context,
      });
    }

    logAuditEvent({
      action: "winners.payout.update",
      actorId: context.actorId,
      actorRole: context.role,
      entity: "Winner",
      entityId: winner.id,
      requestId: context.requestId,
      metadata: {
        previousStatus: winner.payoutStatus,
        nextStatus: payload.payoutStatus,
      },
    });

    return toWinnerDto(updated);
  },

  async enforceProofDeadlines(runAt = nowDate(), requestContext = {}) {
    const expiredCandidates =
      await winnersRepository.findProofDeadlineExceededCandidates(runAt);
    const context = buildRequestContext(requestContext);
    const updatedWinners = [];

    for (const winner of expiredCandidates) {
      if (winner.payoutStatus === WINNER_PAYOUT_STATUSES.REJECTED) {
        continue;
      }

      const updated = await winnersRepository.updateById(winner.id, {
        payoutStatus: WINNER_PAYOUT_STATUSES.REJECTED,
        rejectedAt: runAt,
        rejectionReason:
          winner.rejectionReason || "Proof submission deadline exceeded.",
        metadata: {
          ...(winner.metadata || {}),
          deadlineEnforcedAt: runAt,
        },
      });

      dispatchNotificationEvent({
        scope: "winners",
        userId: winner.userId,
        eventType: NOTIFICATION_EVENT_TYPES.PROOF_REJECTED,
        context: {
          winnerId: winner.id,
          rejectionReason: "Proof submission deadline exceeded.",
        },
        dedupeKey: `winner:${winner.id}:proof_deadline_exceeded`,
        requestContext: context,
      });

      updatedWinners.push(toWinnerDto(updated));
    }

    return {
      processedAt: runAt,
      updatedCount: updatedWinners.length,
      winners: updatedWinners,
    };
  },
};
