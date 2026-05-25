import { describe, expect, it } from "vitest";

import {
  buildReadinessChecklist,
  getDrawReadinessState,
  getRecentActivityItems,
  getSelectedCharity,
  getSucceededDonationTotalMinor,
  getTotalWinnerPrizeMinor,
  getUnreadNotificationsCount
} from "@/features/dashboard";

describe("dashboard helpers", () => {
  it("builds a checklist with incomplete readiness steps", () => {
    const result = buildReadinessChecklist({
      profileStatus: {
        userId: "user-1",
        userStatus: "active",
        emailVerified: true,
        profileCompleted: false,
        profileVerificationStatus: "pending_verification",
        eligibleForSubscription: false
      },
      charitySelection: null,
      subscription: {
        id: "sub-1",
        userId: "user-1",
        planCode: "monthly",
        planNameSnapshot: "Monthly",
        planPriceInrSnapshot: 179,
        status: "pending_payment"
      },
      scoreEligibility: {
        rule: {
          qualifyingWindowSize: 5,
          ordering: "submission_timestamp_desc",
          excludedFromQualifying: ["backdated"]
        },
        scores: [],
        qualifyingCount: 2,
        totalQualifyingSubmissions: 2,
        duplicateContestNumbers: [],
        isEligible: false,
        reasons: ["insufficient_qualifying_scores"]
      }
    });

    expect(result.ready).toBe(false);
    expect(result.remainingCount).toBeGreaterThan(0);
    expect(result.items.find((item) => item.key === "email")?.completed).toBe(true);
    expect(
      result.items.find((item) => item.key === "subscription")?.completed
    ).toBe(false);
  });

  it("recognizes draw readiness when profile, subscription, and scores are aligned", () => {
    const result = getDrawReadinessState({
      profileStatus: {
        userId: "user-1",
        userStatus: "active",
        emailVerified: true,
        profileCompleted: true,
        profileVerificationStatus: "verified",
        eligibleForSubscription: true
      },
      subscription: {
        id: "sub-1",
        userId: "user-1",
        planCode: "quarterly",
        planNameSnapshot: "Quarterly",
        planPriceInrSnapshot: 499,
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
      }
    });

    expect(result.label).toBe("On track");
    expect(result.tone).toBe("success");
  });

  it("surfaces score-specific readiness reasons when scores block draw participation", () => {
    const result = getDrawReadinessState({
      profileStatus: {
        userId: "user-1",
        userStatus: "active",
        emailVerified: true,
        profileCompleted: true,
        profileVerificationStatus: "verified",
        eligibleForSubscription: true
      },
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
        qualifyingCount: 4,
        totalQualifyingSubmissions: 4,
        duplicateContestNumbers: [12],
        isEligible: false,
        reasons: ["duplicate_contest_numbers"]
      }
    });

    expect(result.label).toBe("Needs attention");
    expect(result.description).toContain("Duplicate contest numbers");
  });

  it("summarizes notifications, charity, activity, and winnings correctly", () => {
    expect(
      getUnreadNotificationsCount([
        { id: "n1", title: "A", message: "A" },
        { id: "n2", title: "B", message: "B", readAt: "2026-04-01T00:00:00.000Z" }
      ])
    ).toBe(1);

    expect(
      getSelectedCharity({
        charities: [
          { id: "c1", code: "one", name: "One", mission: "Mission" },
          { id: "c2", code: "two", name: "Two", mission: "Mission" }
        ],
        selection: { charityId: "c2" }
      })?.name
    ).toBe("Two");

    expect(
      getSucceededDonationTotalMinor([
        {
          id: "d1",
          userId: "u1",
          charityId: "c1",
          paymentId: "p1",
          paymentIntentId: "pi_1",
          source: "subscription_addon",
          currency: "INR",
          amountMinor: 1000,
          amountMajor: "10.00",
          status: "succeeded"
        },
        {
          id: "d2",
          userId: "u1",
          charityId: "c1",
          paymentId: "p2",
          paymentIntentId: "pi_2",
          source: "subscription_addon",
          currency: "INR",
          amountMinor: 500,
          amountMajor: "5.00",
          status: "failed"
        }
      ])
    ).toBe(1000);

    expect(
      getTotalWinnerPrizeMinor([
        {
          id: "w1",
          drawId: "d1",
          publishedResultId: "r1",
          entryId: "e1",
          userId: "u1",
          matchCount: 3,
          contestNumbers: [1, 2, 3, 4, 5],
          matchedNumbers: [1, 2, 3],
          prizeAmountMinor: 10000,
          prizeAmountMajor: "100.00",
          payoutStatus: "approved"
        }
      ])
    ).toBe(10000);

    const activity = getRecentActivityItems({
      notifications: [
        {
          id: "n1",
          title: "Payment succeeded",
          message: "Your payment is confirmed.",
          eventType: "payment_success",
          createdAt: "2026-04-24T12:00:00.000Z"
        }
      ],
      scores: [
        {
          id: "s1",
          playedDate: "2026-04-23",
          value: 18,
          contestNumber: 18,
          status: "confirmed",
          submittedAt: "2026-04-24T10:00:00.000Z",
          isBackdated: false
        }
      ],
      payments: [
        {
          id: "p1",
          state: "processing",
          createdAt: "2026-04-24T09:00:00.000Z"
        }
      ],
      winners: []
    });

    expect(activity[0]?.title).toBe("Payment succeeded");
    expect(activity).toHaveLength(3);
  });
});
