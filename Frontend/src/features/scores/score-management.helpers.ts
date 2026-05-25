import type { ScoreEligibilityState, ScoreQualifyingView, ScoreRecord } from "@/types";

export const SCORE_QUALIFYING_WINDOW_SIZE = 5;

const reasonMessages: Record<
  string,
  { label: string; description: string; nextStep: string }
> = {
  insufficient_qualifying_scores: {
    label: "Need more qualifying scores",
    description:
      "You need five active, non-backdated qualifying submissions before the competition set is complete.",
    nextStep: "Add more confirmed scores using today’s played date when accurate."
  },
  duplicate_contest_numbers: {
    label: "Duplicate contest numbers",
    description:
      "The latest five qualifying contest numbers must all be unique to stay competition-ready.",
    nextStep: "Submit a different score value so the qualifying five stay distinct."
  }
};

const toLocalDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const getTodayDateKey = (referenceDate = new Date()) => toLocalDateKey(referenceDate);

export const isBackdatedScoreCandidate = (
  playedDate?: string,
  referenceDate = new Date()
) => {
  if (!playedDate) {
    return false;
  }

  return playedDate < getTodayDateKey(referenceDate);
};

export const findDuplicateContestNumbers = (scores: Array<{ contestNumber: number }>) => {
  const seen = new Set<number>();
  const duplicates = new Set<number>();

  scores.forEach((score) => {
    if (seen.has(score.contestNumber)) {
      duplicates.add(score.contestNumber);
    }

    seen.add(score.contestNumber);
  });

  return [...duplicates];
};

export const buildProspectiveQualifyingWindow = ({
  candidateContestNumber,
  currentQualifyingScores,
  isBackdated,
  windowSize = SCORE_QUALIFYING_WINDOW_SIZE
}: {
  candidateContestNumber: number;
  currentQualifyingScores: ScoreRecord[];
  isBackdated: boolean;
  windowSize?: number;
}) => {
  if (isBackdated) {
    return currentQualifyingScores.slice(0, windowSize);
  }

  return [
    {
      id: "candidate",
      playedDate: "",
      value: candidateContestNumber,
      contestNumber: candidateContestNumber,
      status: "candidate",
      submittedAt: new Date().toISOString(),
      isBackdated: false
    } satisfies ScoreRecord,
    ...currentQualifyingScores
  ].slice(0, windowSize);
};

export const getProspectiveDuplicateValidation = ({
  candidateContestNumber,
  currentQualifyingScores,
  isBackdated
}: {
  candidateContestNumber?: number;
  currentQualifyingScores: ScoreRecord[];
  isBackdated: boolean;
}) => {
  if (!candidateContestNumber || isBackdated) {
    return {
      hasDuplicateRisk: false,
      duplicates: [] as number[],
      prospectiveWindow: currentQualifyingScores.slice(0, SCORE_QUALIFYING_WINDOW_SIZE)
    };
  }

  const prospectiveWindow = buildProspectiveQualifyingWindow({
    candidateContestNumber,
    currentQualifyingScores,
    isBackdated
  });
  const duplicates = findDuplicateContestNumbers(prospectiveWindow);

  return {
    hasDuplicateRisk: duplicates.length > 0,
    duplicates,
    prospectiveWindow
  };
};

export const getEligibilityExplanation = (eligibility?: ScoreEligibilityState | null) => {
  if (!eligibility) {
    return {
      title: "Eligibility is loading",
      description: "We’re checking your latest five qualifying scores now.",
      tone: "info" as const,
      nextSteps: [] as string[]
    };
  }

  if (eligibility.isEligible) {
    return {
      title: "Eligible",
      description:
        "Your latest five qualifying submissions are complete, distinct, and ready for competition.",
      tone: "success" as const,
      nextSteps: [
        "Keep submitting accurate, non-backdated scores when you play.",
        "Avoid replacing a qualifying score with a duplicate contest number."
      ]
    };
  }

  const nextSteps = eligibility.reasons.map((reason) => reasonMessages[reason]?.nextStep).filter(Boolean);

  return {
    title: "Not Eligible",
    description:
      eligibility.reasons
        .map((reason) => reasonMessages[reason]?.description || reason)
        .join(" ") ||
      "Your latest five qualifying scores still need attention before competition eligibility is restored.",
    tone: "warning" as const,
    nextSteps
  };
};

export const getEligibilityReasonLabels = (eligibility?: ScoreEligibilityState | null) =>
  (eligibility?.reasons || []).map(
    (reason) => reasonMessages[reason]?.label || reason.replace(/_/g, " ")
  );

export const getQualifyingScores = (
  qualifyingView?: ScoreQualifyingView | null
) => qualifyingView?.scores || [];

export const getScoreHistory = (scores: ScoreRecord[] = []) =>
  [...scores].sort(
    (left, right) =>
      new Date(right.submittedAt || right.createdAt || 0).getTime() -
      new Date(left.submittedAt || left.createdAt || 0).getTime()
  );

export const getScoreDateValidation = (playedDate?: string) => {
  const today = getTodayDateKey();

  if (!playedDate) {
    return {
      hasFutureDate: false,
      isBackdated: false
    };
  }

  return {
    hasFutureDate: playedDate > today,
    isBackdated: playedDate < today
  };
};
