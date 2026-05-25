import { describe, expect, it } from "vitest";

import { buildOnboardingState } from "@/features/onboarding";
import { routePaths } from "@/routes/paths";

describe("onboarding helpers", () => {
  it("sends incomplete members to the next missing step", () => {
    const result = buildOnboardingState({
      user: {
        id: "user-1",
        email: "user@example.com",
        displayName: "User",
        role: "user",
        status: "active"
      },
      profileStatus: {
        userId: "user-1",
        userStatus: "active",
        emailVerified: true,
        profileCompleted: false,
        profileVerificationStatus: "pending_verification",
        eligibleForSubscription: false
      },
      charitySelection: null,
      subscription: null
    });

    expect(result.ready).toBe(false);
    expect(result.currentStepKey).toBe("profile");
    expect(result.nextPath).toBe(routePaths.onboardingProfile);
    expect(result.blockers).toContain("Complete your full profile details.");
  });

  it("marks the flow ready only after verification, charity, and payment are aligned", () => {
    const result = buildOnboardingState({
      user: {
        id: "user-1",
        email: "user@example.com",
        displayName: "User",
        role: "user",
        status: "active"
      },
      profileStatus: {
        userId: "user-1",
        userStatus: "active",
        emailVerified: true,
        profileCompleted: true,
        profileVerificationStatus: "verified",
        eligibleForSubscription: true
      },
      charitySelection: {
        charityId: "charity-1"
      },
      subscription: {
        id: "sub-1",
        userId: "user-1",
        planCode: "quarterly",
        planNameSnapshot: "Quarterly",
        planPriceInrSnapshot: 499,
        status: "active"
      }
    });

    expect(result.ready).toBe(true);
    expect(result.currentStepKey).toBe("success");
    expect(result.nextPath).toBe(routePaths.onboardingSuccess);
    expect(result.steps.every((step) => step.completed)).toBe(true);
  });
});
