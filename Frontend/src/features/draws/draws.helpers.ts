import { getEligibilityReasonLabels } from "@/features/scores";
import type {
  DrawConfigRecord,
  DrawPrizeDistribution,
  DrawPrizePoolRecord,
  DrawPublishedResultRecord,
  DrawRecord,
  ScoreEligibilityState,
  SubscriptionRecord,
  WinnerProofSubmissionRecord,
  WinnerRecord
} from "@/types";

export const DEFAULT_DRAW_CONFIG: DrawConfigRecord = {
  id: "default-draw-config",
  mode: "random",
  numberRangeMin: 1,
  numberRangeMax: 45,
  numbersPerDraw: 5,
  eligibilityCutoffDaysBeforeMonthEnd: 7,
  proofDeadlineDays: 23,
  maxProofFiles: 2,
  prizeDistribution: {
    match3Percentage: 20,
    match4Percentage: 30,
    match5Percentage: 50
  }
};

export const getEffectiveDrawConfig = (config?: DrawConfigRecord | null): DrawConfigRecord => ({
  ...DEFAULT_DRAW_CONFIG,
  ...config,
  prizeDistribution: {
    ...DEFAULT_DRAW_CONFIG.prizeDistribution,
    ...(config?.prizeDistribution || {})
  }
});

export const getRewardExplainerItems = (distribution?: DrawPrizeDistribution | null) => {
  const effectiveDistribution = {
    ...DEFAULT_DRAW_CONFIG.prizeDistribution,
    ...(distribution || {})
  };

  return [
    {
      matchCount: 5,
      label: "5-match jackpot",
      share: effectiveDistribution.match5Percentage || 50,
      description:
        "Match all five contest numbers to chase the jackpot. If nobody claims it, the full 5-match carryover rolls into the next draw with no cap."
    },
    {
      matchCount: 4,
      label: "4-match payout",
      share: effectiveDistribution.match4Percentage || 30,
      description:
        "Four matches share the mid-tier reward bucket. If there are no 4-match winners, that unused amount moves to company revenue."
    },
    {
      matchCount: 3,
      label: "3-match payout",
      share: effectiveDistribution.match3Percentage || 20,
      description:
        "Three matches unlock the entry-tier reward bucket. If nobody hits 3 matches, that unused amount does not roll over."
    }
  ];
};

export const sortWinnersByRecent = (winners: WinnerRecord[] = []) =>
  [...winners].sort(
    (left, right) =>
      new Date(right.updatedAt || right.createdAt || 0).getTime() -
      new Date(left.updatedAt || left.createdAt || 0).getTime()
  );

export const getLatestProofSubmission = (
  proofs: WinnerProofSubmissionRecord[] = []
): WinnerProofSubmissionRecord | null =>
  [...proofs].sort(
    (left, right) =>
      new Date(right.submittedAt || right.createdAt || 0).getTime() -
      new Date(left.submittedAt || left.createdAt || 0).getTime()
  )[0] || null;

export const getLatestPublishedDraw = (draws: DrawRecord[] = []) =>
  [...draws]
    .filter((draw) => draw.status === "published")
    .sort(
      (left, right) =>
        new Date(right.publishedAt || right.drawAt || 0).getTime() -
        new Date(left.publishedAt || left.drawAt || 0).getTime()
    )[0] || null;

export const formatCountdown = (date?: string | null, now = new Date()) => {
  if (!date) {
    return "Deadline unavailable";
  }

  const deadline = new Date(date);
  const difference = deadline.getTime() - now.getTime();

  if (difference <= 0) {
    return "Deadline passed";
  }

  const totalMinutes = Math.floor(difference / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }

  return `${Math.max(minutes, 1)}m left`;
};

export const isProofWindowOpen = (winner?: WinnerRecord | null, now = new Date()) => {
  if (!winner?.verificationDeadlineAt) {
    return false;
  }

  return new Date(winner.verificationDeadlineAt).getTime() > now.getTime();
};

export const getProofDeadlineTone = (winner?: WinnerRecord | null, now = new Date()) => {
  if (!winner?.verificationDeadlineAt) {
    return "muted" as const;
  }

  const difference =
    new Date(winner.verificationDeadlineAt).getTime() - now.getTime();

  if (difference <= 0) {
    return "danger" as const;
  }

  if (difference <= 1000 * 60 * 60 * 24 * 3) {
    return "warning" as const;
  }

  return "info" as const;
};

export const getProofSubmissionGuidance = ({
  winner,
  latestProof,
  now = new Date()
}: {
  winner?: WinnerRecord | null;
  latestProof?: WinnerProofSubmissionRecord | null;
  now?: Date;
}) => {
  if (!winner) {
    return {
      tone: "muted" as const,
      title: "Select a winner record",
      description: "Choose a win to view proof requirements and payout progress.",
      canSubmit: false
    };
  }

  if (!isProofWindowOpen(winner, now)) {
    return {
      tone: "danger" as const,
      title: "Proof window closed",
      description:
        "The proof deadline has passed for this winner record, so additional proof submissions are no longer allowed.",
      canSubmit: false
    };
  }

  if (winner.payoutStatus === "paid") {
    return {
      tone: "success" as const,
      title: "Payout completed",
      description:
        "This winner record has already completed verification and payout, so no more proof submissions are needed.",
      canSubmit: false
    };
  }

  if (winner.payoutStatus === "payout_pending" || winner.payoutStatus === "approved") {
    return {
      tone: "info" as const,
      title: "Verification complete",
      description:
        "Your proof has cleared review. The winner record is now moving through payout processing.",
      canSubmit: false
    };
  }

  if (winner.payoutStatus === "rejected") {
    return {
      tone: "warning" as const,
      title: "Resubmission available",
      description:
        winner.rejectionReason?.trim() ||
        latestProof?.rejectionReason?.trim() ||
        "A rejection reason is on file. You can replace your proof and resubmit before the deadline.",
      canSubmit: true
    };
  }

  if (latestProof?.status === "submitted") {
    return {
      tone: "info" as const,
      title: "Proof under review",
      description:
        "Your latest proof submission is with the team for verification. You can still review the files below while you wait.",
      canSubmit: false
    };
  }

  return {
    tone: "warning" as const,
    title: "Proof still required",
    description:
      "Upload one or two proof files before the deadline so the winner record can move into verification review.",
    canSubmit: true
  };
};

export const buildWinnerLifecycleSteps = ({
  winner,
  latestProof,
  now = new Date()
}: {
  winner?: WinnerRecord | null;
  latestProof?: WinnerProofSubmissionRecord | null;
  now?: Date;
}) => {
  const proofWindowOpen = isProofWindowOpen(winner, now);

  return [
    {
      title: "Result published",
      description: "The winning record was created after draw publication.",
      state: "complete" as const
    },
    {
      title: "Proof submitted",
      description: latestProof
        ? `Submission #${latestProof.submissionNumber} was sent for review.`
        : proofWindowOpen
          ? "Upload one or two proof files before the deadline."
          : "No proof was received before the deadline closed.",
      state: latestProof ? ("complete" as const) : ("current" as const)
    },
    {
      title: "Verification review",
      description:
        winner?.payoutStatus === "approved" ||
        winner?.payoutStatus === "payout_pending" ||
        winner?.payoutStatus === "paid"
          ? "The backend has approved this winner record."
          : winner?.payoutStatus === "rejected"
            ? "The backend rejected the current proof or winner record."
            : latestProof?.status === "submitted"
              ? "Verification review is in progress."
              : "Verification begins after proof submission.",
      state:
        winner?.payoutStatus === "approved" ||
        winner?.payoutStatus === "payout_pending" ||
        winner?.payoutStatus === "paid"
          ? ("complete" as const)
          : latestProof?.status === "submitted" || winner?.payoutStatus === "pending_verification"
            ? ("current" as const)
            : ("upcoming" as const)
    },
    {
      title: "Payout",
      description:
        winner?.payoutStatus === "paid"
          ? "Payout completed."
          : winner?.payoutStatus === "payout_pending"
            ? "Payout is queued and pending settlement."
            : winner?.payoutStatus === "approved"
              ? "The record is approved and will move into payout handling."
              : "Payout starts after verification approval.",
      state:
        winner?.payoutStatus === "paid"
          ? ("complete" as const)
          : winner?.payoutStatus === "payout_pending"
            ? ("current" as const)
            : ("upcoming" as const)
    }
  ];
};

export const getParticipationSummary = ({
  subscription,
  scoreEligibility,
  qualifyingCount,
  hasCurrentMonthWinner
}: {
  subscription?: SubscriptionRecord | null;
  scoreEligibility?: ScoreEligibilityState | null;
  qualifyingCount: number;
  hasCurrentMonthWinner: boolean;
}) => {
  if (hasCurrentMonthWinner) {
    return {
      title: "Winner recorded",
      label: "Published result",
      tone: "success" as const,
      description:
        "A winner record already exists for this month, so your participation moved beyond readiness into the results lifecycle."
    };
  }

  if (subscription?.status === "grace_period") {
    return {
      title: "Participation at risk",
      label: "Grace period",
      tone: "warning" as const,
      description:
        "Your subscription is in grace period. If it lapses by draw day, you lose this month’s automatic entry."
    };
  }

  if (subscription?.status === "active" && scoreEligibility?.isEligible) {
    return {
      title: "On track for automatic entry",
      label: "Eligible",
      tone: "success" as const,
      description:
        "With an active subscription and five qualifying contest numbers, you are aligned with the automatic monthly entry rules."
    };
  }

  return {
    title: "Not ready yet",
    label: `${qualifyingCount}/5 qualifying`,
    tone: "warning" as const,
    description:
      scoreEligibility?.reasons?.length
        ? getEligibilityReasonLabels(scoreEligibility).join(", ")
        : "Complete profile, billing, and score readiness so the next draw can include your entry."
  };
};

export const getJackpotMessage = (prizePool?: DrawPrizePoolRecord | null) => {
  if (!prizePool) {
    return {
      title: "Jackpot rollover stays uncapped",
      description:
        "If a 5-match jackpot goes unclaimed, it carries forward into the next published draw with no rollover cap."
    };
  }

  if (prizePool.jackpotCarryOutMinor > 0) {
    return {
      title: "Jackpot rolled forward",
      description:
        "No 5-match claim closed out the current jackpot, so the carryover amount is now feeding the next draw."
    };
  }

  if (prizePool.winners5Count > 0) {
    return {
      title: "Jackpot paid out",
      description:
        "A 5-match winner claimed the jackpot in this published draw, so the carryover resets before future manual top-ups or new rollovers."
    };
  }

  return {
    title: "Jackpot building",
    description:
      "The 5-match bucket can include both the current prize allocation and any carry-in balance from earlier unclaimed jackpots."
  };
};

export const isCurrentMonthWinner = (
  winner: WinnerRecord,
  now = new Date()
) => {
  const recordDate = new Date(winner.createdAt || winner.updatedAt || 0);

  return (
    recordDate.getFullYear() === now.getFullYear() &&
    recordDate.getMonth() === now.getMonth()
  );
};

export const formatFileSize = (sizeBytes?: number) => {
  if (!sizeBytes) {
    return "Size not available";
  }

  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const fileToDataUrl = async (file: File) =>
  await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });

export const getPublishedResultSummary = ({
  draw,
  result
}: {
  draw?: DrawRecord | null;
  result?: DrawPublishedResultRecord | null;
}) => {
  if (!draw || !result) {
    return {
      title: "Published draw details are not available here yet",
      description:
        "Your personal winner records still update correctly, but the current backend does not expose a user-safe published draw snapshot on this surface."
    };
  }

  return {
    title: `${draw.drawMonthKey} published`,
    description:
      "Winning numbers and prize snapshots are immutable once the draw is published."
  };
};
