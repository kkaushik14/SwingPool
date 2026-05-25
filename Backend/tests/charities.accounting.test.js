import { describe, expect, it } from "vitest";

import {
  calculateSubscriptionAllocationSplit,
  computeOutstandingByCharity,
} from "../src/components/charities/charity-accounting.js";

describe("Charity Accounting", () => {
  it("splits subscription base using gateway fee, prize pool, mandatory charity, and platform revenue", () => {
    const split = calculateSubscriptionAllocationSplit({
      subscriptionBaseMinor: 17900,
      optionalDonationMinor: 0,
      gatewayFeePercentage: 2,
      prizePoolPercentage: 35,
      mandatoryCharityPercentage: 10,
    });

    expect(split.totals.subscriptionBaseMinor).toBe(17900);
    expect(split.totals.postFeeSubscriptionBaseMinor).toBe(17542);
    expect(split.allocations.gatewayFeeMinor).toBe(358);
    expect(split.allocations.prizePoolMinor).toBe(6140);
    expect(split.allocations.mandatoryCharityMinor).toBe(1754);
    expect(split.allocations.platformRevenueMinor).toBe(9648);

    const totalDistributed =
      split.allocations.gatewayFeeMinor +
      split.allocations.prizePoolMinor +
      split.allocations.mandatoryCharityMinor +
      split.allocations.optionalCharityAddonMinor +
      split.allocations.platformRevenueMinor;

    expect(totalDistributed).toBe(split.totals.totalCollectedMinor);
  });

  it("passes optional add-on fully to charity while keeping base split deterministic", () => {
    const split = calculateSubscriptionAllocationSplit({
      subscriptionBaseMinor: 17900,
      optionalDonationMinor: 5000,
      gatewayFeePercentage: 0,
      prizePoolPercentage: 35,
      mandatoryCharityPercentage: 10,
    });

    expect(split.allocations.optionalCharityAddonMinor).toBe(5000);
    expect(split.allocations.mandatoryCharityMinor).toBe(1790);
    expect(split.allocations.mandatoryPlusOptionalCharityMinor).toBe(6790);
    expect(split.allocations.platformRevenueMinor).toBe(9845);
    expect(split.totals.totalCollectedMinor).toBe(22900);
  });

  it("computes outstanding charity payout position from allocations, adjustments, and payouts", () => {
    const outstanding = computeOutstandingByCharity({
      totalAllocatedMinor: 120000,
      totalAdjustedCreditMinor: 5000,
      totalAdjustedDebitMinor: 2000,
      totalPayoutCompletedMinor: 40000,
    });

    expect(outstanding.grossPayableMinor).toBe(125000);
    expect(outstanding.netPayableMinor).toBe(123000);
    expect(outstanding.outstandingMinor).toBe(83000);
    expect(outstanding.outstandingMajor).toBe("830.00");
  });
});
