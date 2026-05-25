import { describe, expect, it } from "vitest";

import {
  DEFAULT_DRAW_CONFIG,
  buildWinnerLifecycleSteps,
  formatCountdown,
  getJackpotMessage,
  getLatestProofSubmission,
  getParticipationSummary,
  getProofSubmissionGuidance,
  getRewardExplainerItems,
  sortWinnersByRecent
} from "@/features/draws";
import type { WinnerProofSubmissionRecord, WinnerRecord } from "@/types";

const createWinner = (overrides: Partial<WinnerRecord> = {}): WinnerRecord => ({
  id: overrides.id || crypto.randomUUID(),
  drawId: overrides.drawId || "draw-1",
  publishedResultId: overrides.publishedResultId || "result-1",
  entryId: overrides.entryId || "entry-1",
  userId: overrides.userId || "user-1",
  matchCount: overrides.matchCount || 3,
  contestNumbers: overrides.contestNumbers || [1, 2, 3, 4, 5],
  matchedNumbers: overrides.matchedNumbers || [1, 2, 3],
  prizeAmountMinor: overrides.prizeAmountMinor || 10000,
  prizeAmountMajor: overrides.prizeAmountMajor || "₹100",
  payoutStatus: overrides.payoutStatus || "pending_verification",
  verificationDeadlineAt:
    overrides.verificationDeadlineAt || "2026-05-20T00:00:00.000Z",
  proofSubmissionCount: overrides.proofSubmissionCount || 0,
  createdAt: overrides.createdAt || "2026-05-01T00:00:00.000Z",
  updatedAt: overrides.updatedAt || "2026-05-01T00:00:00.000Z",
  ...overrides
});

const createProof = (
  overrides: Partial<WinnerProofSubmissionRecord> = {}
): WinnerProofSubmissionRecord => ({
  id: overrides.id || crypto.randomUUID(),
  winnerId: overrides.winnerId || "winner-1",
  drawId: overrides.drawId || "draw-1",
  userId: overrides.userId || "user-1",
  submissionNumber: overrides.submissionNumber || 1,
  files: overrides.files || [
    {
      fileUrl: "https://example.com/proof.png",
      fileName: "proof.png",
      fileType: "image/png",
      sizeBytes: 1024
    }
  ],
  status: overrides.status || "submitted",
  submittedAt: overrides.submittedAt || "2026-05-02T00:00:00.000Z",
  ...overrides
});

describe("draws helpers", () => {
  it("uses the backend default reward distribution when no config override exists", () => {
    const result = getRewardExplainerItems(DEFAULT_DRAW_CONFIG.prizeDistribution);

    expect(result.map((item) => item.share)).toEqual([50, 30, 20]);
    expect(result[0]?.description).toContain("rolls into the next draw");
  });

  it("formats countdowns in a compact readable way", () => {
    expect(
      formatCountdown("2026-05-20T06:00:00.000Z", new Date("2026-05-18T00:00:00.000Z"))
    ).toBe("2d 6h left");
    expect(
      formatCountdown("2026-05-18T00:30:00.000Z", new Date("2026-05-18T00:00:00.000Z"))
    ).toBe("30m left");
  });

  it("builds proof guidance for rejected winners who can resubmit", () => {
    const winner = createWinner({
      payoutStatus: "rejected",
      rejectionReason: "Please upload clearer documentation."
    });
    const latestProof = createProof({
      status: "rejected",
      rejectionReason: "Please upload clearer documentation."
    });

    const guidance = getProofSubmissionGuidance({
      winner,
      latestProof,
      now: new Date("2026-05-10T00:00:00.000Z")
    });

    expect(guidance.canSubmit).toBe(true);
    expect(guidance.title).toBe("Resubmission available");
    expect(guidance.description).toContain("clearer documentation");
  });

  it("summarizes participation accurately when eligibility is complete", () => {
    const result = getParticipationSummary({
      subscription: {
        id: "sub-1",
        userId: "user-1",
        planCode: "monthly",
        planNameSnapshot: "Monthly",
        planPriceInrSnapshot: 179,
        status: "active"
      },
      scoreEligibility: {
        rule: {
          qualifyingWindowSize: 5,
          ordering: "submission_timestamp_desc",
          excludedFromQualifying: ["backdated"]
        },
        scores: [],
        qualifyingCount: 5,
        totalQualifyingSubmissions: 5,
        duplicateContestNumbers: [],
        isEligible: true,
        reasons: []
      },
      qualifyingCount: 5,
      hasCurrentMonthWinner: false
    });

    expect(result.tone).toBe("success");
    expect(result.title).toBe("On track for automatic entry");
  });

  it("orders winners and proofs by latest activity and produces a lifecycle", () => {
    const winners = sortWinnersByRecent([
      createWinner({ id: "older", updatedAt: "2026-05-01T00:00:00.000Z" }),
      createWinner({ id: "newer", updatedAt: "2026-05-10T00:00:00.000Z" })
    ]);
    const latestProof = getLatestProofSubmission([
      createProof({ id: "proof-1", submissionNumber: 1, submittedAt: "2026-05-02T00:00:00.000Z" }),
      createProof({ id: "proof-2", submissionNumber: 2, submittedAt: "2026-05-04T00:00:00.000Z" })
    ]);
    const lifecycle = buildWinnerLifecycleSteps({
      winner: createWinner({ payoutStatus: "payout_pending" }),
      latestProof
    });

    expect(winners.map((winner) => winner.id)).toEqual(["newer", "older"]);
    expect(latestProof?.submissionNumber).toBe(2);
    expect(lifecycle[3]?.state).toBe("current");
  });

  it("describes jackpot rollover when carry-out exists", () => {
    const message = getJackpotMessage({
      id: "pool-1",
      drawId: "draw-1",
      currency: "INR",
      subscriptionPrizePoolMinor: 100000,
      manualJackpotAddedMinor: 0,
      jackpotCarryInMinor: 20000,
      bucket3Minor: 20000,
      bucket4Minor: 30000,
      bucket5Minor: 50000,
      winners3Count: 2,
      winners4Count: 0,
      winners5Count: 0,
      match3PaidMinor: 20000,
      match4PaidMinor: 0,
      match5PaidMinor: 0,
      unused3ToRevenueMinor: 0,
      unused4ToRevenueMinor: 30000,
      companyRevenueMinor: 30000,
      jackpotCarryOutMinor: 70000
    });

    expect(message.title).toBe("Jackpot rolled forward");
  });
});
