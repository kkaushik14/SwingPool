export interface ScoreRecord {
  id: string;
  userId?: string;
  playedDate: string;
  playedDateKey?: string;
  value: number;
  contestNumber: number;
  status: string;
  source?: string;
  submittedAt: string;
  submissionLocalDateKey?: string;
  isBackdated: boolean;
  confirmedAt?: string | null;
  confirmedBy?: string | null;
  adminEditCount?: number;
  lastAdminEditedAt?: string | null;
  lastAdminEditedBy?: string | null;
  lastAdminEditReason?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScoreCompetitionRule {
  qualifyingWindowSize: number;
  ordering: string;
  excludedFromQualifying: string[];
}

export interface ScoreEligibilityState {
  rule: ScoreCompetitionRule;
  scores: ScoreRecord[];
  qualifyingCount: number;
  totalQualifyingSubmissions: number;
  duplicateContestNumbers: number[];
  isEligible: boolean;
  reasons: string[];
  generatedAt?: string;
}

export interface ScoreQualifyingView extends ScoreEligibilityState {
  summary: {
    qualifyingCount: number;
    requiredQualifyingCount: number;
    isEligible: boolean;
  };
}
