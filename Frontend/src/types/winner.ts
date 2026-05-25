export interface WinnerRecord {
  id: string;
  drawId: string;
  publishedResultId: string;
  entryId: string;
  userId: string;
  matchCount: 3 | 4 | 5;
  contestNumbers: number[];
  matchedNumbers: number[];
  prizeAmountMinor: number;
  prizeAmountMajor: string;
  payoutStatus:
    | "pending_verification"
    | "approved"
    | "rejected"
    | "payout_pending"
    | "paid";
  verificationDeadlineAt?: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string;
  payoutPendingAt?: string | null;
  paidAt?: string | null;
  payoutReference?: string;
  latestProofSubmissionId?: string | null;
  proofSubmissionCount?: number;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface WinnerProofFileRecord {
  fileUrl: string;
  fileName: string;
  fileType?: string;
  sizeBytes?: number;
}

export interface WinnerProofSubmissionRecord {
  id: string;
  winnerId: string;
  drawId: string;
  userId: string;
  submissionNumber: number;
  files: WinnerProofFileRecord[];
  status: "submitted" | "approved" | "rejected";
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  rejectionReason?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}
