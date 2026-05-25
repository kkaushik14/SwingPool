const toPlain = (value) => (value?.toObject ? value.toObject() : value);

export const toScoreDto = (score) => {
  if (!score) {
    return null;
  }

  const item = toPlain(score);

  return {
    id: item.id || item._id?.toString(),
    userId: item.userId,
    playedDate: item.playedDate,
    playedDateKey: item.playedDateKey,
    value: item.value,
    contestNumber: item.contestNumber,
    status: item.status,
    source: item.source,
    submittedAt: item.submittedAt,
    submissionLocalDateKey: item.submissionLocalDateKey,
    isBackdated: item.isBackdated,
    confirmedAt: item.confirmedAt,
    confirmedBy: item.confirmedBy,
    adminEditCount: item.adminEditCount,
    lastAdminEditedAt: item.lastAdminEditedAt,
    lastAdminEditedBy: item.lastAdminEditedBy,
    lastAdminEditReason: item.lastAdminEditReason,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};
