import { describe, expect, it, vi } from "vitest";

import {
  buildProspectiveQualifyingWindow,
  getEligibilityExplanation,
  getEligibilityReasonLabels,
  getProspectiveDuplicateValidation,
  getScoreDateValidation,
  getScoreHistory,
  getTodayDateKey,
  isBackdatedScoreCandidate
} from "@/features/scores";
import type { ScoreRecord } from "@/types";

const createScore = (overrides: Partial<ScoreRecord> = {}): ScoreRecord => ({
  id: overrides.id || crypto.randomUUID(),
  playedDate: overrides.playedDate || "2026-04-24",
  value: overrides.value || 18,
  contestNumber: overrides.contestNumber || overrides.value || 18,
  status: overrides.status || "confirmed",
  submittedAt: overrides.submittedAt || "2026-04-24T12:00:00.000Z",
  isBackdated: overrides.isBackdated || false,
  ...overrides
});

describe("score management helpers", () => {
  it("detects local date keys and backdated candidates", () => {
    const referenceDate = new Date("2026-04-24T10:00:00.000Z");

    expect(getTodayDateKey(referenceDate)).toBe("2026-04-24");
    expect(isBackdatedScoreCandidate("2026-04-23", referenceDate)).toBe(true);
    expect(isBackdatedScoreCandidate("2026-04-24", referenceDate)).toBe(false);
  });

  it("keeps a backdated candidate out of the prospective qualifying window", () => {
    const currentWindow = [
      createScore({ id: "s1", contestNumber: 11 }),
      createScore({ id: "s2", contestNumber: 22 })
    ];

    const result = buildProspectiveQualifyingWindow({
      candidateContestNumber: 33,
      currentQualifyingScores: currentWindow,
      isBackdated: true
    });

    expect(result).toEqual(currentWindow);
  });

  it("flags duplicate contest numbers only when a non-backdated candidate would collide", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-24T12:00:00.000Z"));

    const currentWindow = [
      createScore({ id: "s1", contestNumber: 7, submittedAt: "2026-04-24T10:00:00.000Z" }),
      createScore({ id: "s2", contestNumber: 12, submittedAt: "2026-04-23T10:00:00.000Z" })
    ];

    const result = getProspectiveDuplicateValidation({
      candidateContestNumber: 12,
      currentQualifyingScores: currentWindow,
      isBackdated: false
    });

    expect(result.hasDuplicateRisk).toBe(true);
    expect(result.duplicates).toEqual([12]);
    expect(result.prospectiveWindow[0]?.contestNumber).toBe(12);

    vi.useRealTimers();
  });

  it("sorts full score history by latest submission first", () => {
    const history = getScoreHistory([
      createScore({ id: "older", submittedAt: "2026-04-20T09:00:00.000Z" }),
      createScore({ id: "newer", submittedAt: "2026-04-24T09:00:00.000Z" })
    ]);

    expect(history.map((item) => item.id)).toEqual(["newer", "older"]);
  });

  it("explains ineligible states using backend reason codes", () => {
    const explanation = getEligibilityExplanation({
      rule: {
        qualifyingWindowSize: 5,
        ordering: "submission_timestamp_desc",
        excludedFromQualifying: ["backdated"]
      },
      scores: [],
      qualifyingCount: 3,
      totalQualifyingSubmissions: 3,
      duplicateContestNumbers: [9],
      isEligible: false,
      reasons: ["insufficient_qualifying_scores", "duplicate_contest_numbers"]
    });

    expect(explanation.title).toBe("Not Eligible");
    expect(explanation.description).toContain("five active, non-backdated qualifying submissions");
    expect(explanation.nextSteps).toContain(
      "Submit a different score value so the qualifying five stay distinct."
    );
    expect(
      getEligibilityReasonLabels({
        rule: {
          qualifyingWindowSize: 5,
          ordering: "submission_timestamp_desc",
          excludedFromQualifying: ["backdated"]
        },
        scores: [],
        qualifyingCount: 3,
        totalQualifyingSubmissions: 3,
        duplicateContestNumbers: [9],
        isEligible: false,
        reasons: ["duplicate_contest_numbers"]
      })
    ).toEqual(["Duplicate contest numbers"]);
  });

  it("marks future and backdated score dates correctly", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-24T12:00:00.000Z"));

    expect(getScoreDateValidation("2026-04-25")).toEqual({
      hasFutureDate: true,
      isBackdated: false
    });
    expect(getScoreDateValidation("2026-04-23")).toEqual({
      hasFutureDate: false,
      isBackdated: true
    });

    vi.useRealTimers();
  });
});
