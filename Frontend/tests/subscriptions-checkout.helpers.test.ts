import { describe, expect, it } from "vitest";

import {
  buildCheckoutSummary,
  getPaymentJourneyState,
  getUpgradeMessage,
  readSubscriptionPricingSnapshot
} from "@/features/subscriptions";
import type { PaymentRecord, SubscriptionPlan, SubscriptionRecord } from "@/types";

const monthlyPlan: SubscriptionPlan = {
  id: "plan-monthly",
  code: "monthly",
  name: "Monthly",
  priceInr: 179,
  billingCycleDays: 30,
  hierarchyLevel: 1,
  currency: "INR"
};

const quarterlyPlan: SubscriptionPlan = {
  id: "plan-quarterly",
  code: "quarterly",
  name: "Quarterly",
  priceInr: 499,
  billingCycleDays: 90,
  hierarchyLevel: 2,
  currency: "INR"
};

const activeSubscription: SubscriptionRecord = {
  id: "sub-1",
  userId: "user-1",
  planCode: "quarterly",
  planNameSnapshot: "Quarterly",
  planPriceInrSnapshot: 499,
  status: "active",
  currency: "INR"
};

describe("subscription checkout helpers", () => {
  it("flags downward plan moves as blocked", () => {
    const result = getUpgradeMessage({
      currentSubscription: activeSubscription,
      currentPlan: quarterlyPlan,
      selectedPlan: monthlyPlan
    });

    expect(result?.blocked).toBe(true);
    expect(result?.title).toMatch(/Downgrades/);
  });

  it("marks upward plan moves as upgrades", () => {
    const result = getUpgradeMessage({
      currentSubscription: {
        ...activeSubscription,
        planCode: "monthly",
        planNameSnapshot: "Monthly"
      },
      currentPlan: monthlyPlan,
      selectedPlan: quarterlyPlan
    });

    expect(result?.blocked).toBe(false);
    expect(result?.title).toMatch(/upgrade/i);
  });

  it("builds an exact summary from backend split previews", () => {
    const summary = buildCheckoutSummary({
      selectedPlan: monthlyPlan,
      optionalDonationInr: 99,
      pricing: {
        baseAmountInr: 179,
        discountInr: 0,
        payableAmountInr: 278,
        charityContributionInr: 115,
        mandatoryCharityPercentage: 10,
        optionalDonationInr: 99,
        splitPreview: {
          ruleSnapshot: {
            gatewayFeePercentage: 2,
            mandatoryCharityPercentage: 10
          },
          allocations: {
            gatewayFeeMajor: 3.58,
            mandatoryCharityMajor: 16,
            mandatoryPlusOptionalCharityMajor: 115
          }
        }
      }
    });

    expect(summary?.isExact).toBe(true);
    expect(summary?.gatewayFeeInr).toBe(3.58);
    expect(summary?.totalCharityInr).toBe(115);
    expect(summary?.totalPayableInr).toBe(278);
  });

  it("reads pricing snapshots from subscription metadata", () => {
    const snapshot = readSubscriptionPricingSnapshot({
      ...activeSubscription,
      metadata: {
        pricing: {
          baseAmountInr: 499,
          discountInr: 50,
          payableAmountInr: 489,
          totalPayableAmountInr: 489,
          charityContributionInr: 70,
          mandatoryCharityPercentage: 10,
          optionalDonationInr: 40,
          splitPreview: {
            allocations: {
              gatewayFeeMajor: 8.98
            }
          }
        }
      }
    });

    expect(snapshot?.discountInr).toBe(50);
    expect(snapshot?.optionalDonationInr).toBe(40);
    expect(snapshot?.splitPreview?.allocations?.gatewayFeeMajor).toBe(8.98);
  });

  it("treats succeeded backend state as the final success signal", () => {
    const payment: PaymentRecord = {
      id: "payment-1",
      userId: "user-1",
      amount: 27800,
      currency: "inr",
      stripePaymentIntentId: "pi_123",
      state: "succeeded"
    };

    const state = getPaymentJourneyState({
      payment,
      subscription: {
        ...activeSubscription,
        lastPaymentIntentId: "pi_123"
      }
    });

    expect(state.kind).toBe("success");
  });

  it("keeps processing state pending until webhook confirmation arrives", () => {
    const state = getPaymentJourneyState({
      payment: {
        id: "payment-1",
        userId: "user-1",
        amount: 27800,
        currency: "inr",
        stripePaymentIntentId: "pi_pending",
        state: "processing"
      },
      subscription: {
        ...activeSubscription,
        status: "pending_payment",
        lastPaymentIntentId: "pi_pending"
      }
    });

    expect(state.kind).toBe("processing");
    expect(state.description).toMatch(/backend/i);
  });
});
