const toPlain = (value) => (value?.toObject ? value.toObject() : value);

export const toWinnerDto = (winner) => {
  if (!winner) {
    return null;
  }

  const item = toPlain(winner);

  return {
    id: item.id || item._id?.toString(),
    drawId: item.drawId,
    publishedResultId: item.publishedResultId,
    entryId: item.entryId,
    userId: item.userId,
    matchCount: item.matchCount,
    contestNumbers: item.contestNumbers || [],
    matchedNumbers: item.matchedNumbers || [],
    prizeAmountMinor: item.prizeAmountMinor,
    prizeAmountMajor: item.prizeAmountMajor,
    payoutStatus: item.payoutStatus,
    verificationDeadlineAt: item.verificationDeadlineAt,
    approvedAt: item.approvedAt,
    rejectedAt: item.rejectedAt,
    rejectionReason: item.rejectionReason,
    payoutPendingAt: item.payoutPendingAt,
    paidAt: item.paidAt,
    payoutReference: item.payoutReference,
    latestProofSubmissionId: item.latestProofSubmissionId,
    proofSubmissionCount: item.proofSubmissionCount,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const toWinnerProofSubmissionDto = (submission) => {
  if (!submission) {
    return null;
  }

  const item = toPlain(submission);

  return {
    id: item.id || item._id?.toString(),
    winnerId: item.winnerId,
    drawId: item.drawId,
    userId: item.userId,
    submissionNumber: item.submissionNumber,
    files: item.files || [],
    status: item.status,
    submittedAt: item.submittedAt,
    reviewedAt: item.reviewedAt,
    reviewedBy: item.reviewedBy,
    rejectionReason: item.rejectionReason,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};
