import { config } from "../../config/index.js";
import {
  addMoney,
  fromMinorUnits,
  multiplyMoney,
  subtractMoney,
  toMinorUnits,
} from "../../utils/index.js";

import { CHARITY_CURRENCIES } from "./charities.enums.js";

const clampPercentage = (value) => {
  const numeric = Number(value || 0);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  if (numeric < 0) {
    return 0;
  }

  if (numeric > 100) {
    return 100;
  }

  return Number(numeric.toFixed(4));
};

const toNonNegativeInteger = (value) => {
  const numeric = Number(value || 0);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  return Math.max(Math.round(numeric), 0);
};

export const buildDefaultContributionRule = () => ({
  ruleKey: CHARITY_CURRENCIES.INR,
  currency: CHARITY_CURRENCIES.INR,
  gatewayFeePercentage: clampPercentage(config.charity.gatewayFeePercentage),
  prizePoolPercentage: clampPercentage(config.charity.prizePoolPercentage),
  mandatoryCharityPercentage: clampPercentage(
    config.charity.mandatoryCharityPercentage,
  ),
  status: "active",
  effectiveFrom: new Date(),
});

export const calculateSubscriptionAllocationSplit = ({
  subscriptionBaseMinor,
  optionalDonationMinor = 0,
  gatewayFeePercentage,
  prizePoolPercentage,
  mandatoryCharityPercentage,
}) => {
  const baseMinor = toNonNegativeInteger(subscriptionBaseMinor);
  const addonMinor = toNonNegativeInteger(optionalDonationMinor);

  const normalizedGatewayFeePercentage = clampPercentage(gatewayFeePercentage);
  const normalizedPrizePoolPercentage = clampPercentage(prizePoolPercentage);
  const normalizedMandatoryCharityPercentage = clampPercentage(
    mandatoryCharityPercentage,
  );

  const baseMajor = fromMinorUnits(baseMinor, 2);

  const gatewayFeeMajor = multiplyMoney(
    baseMajor,
    normalizedGatewayFeePercentage / 100,
  );
  const gatewayFeeMinor = Math.min(toMinorUnits(gatewayFeeMajor, 2), baseMinor);

  const postFeeBaseMinor = Math.max(baseMinor - gatewayFeeMinor, 0);
  const postFeeBaseMajor = fromMinorUnits(postFeeBaseMinor, 2);

  const prizePoolMajor = multiplyMoney(
    postFeeBaseMajor,
    normalizedPrizePoolPercentage / 100,
  );
  const prizePoolMinor = Math.min(
    toMinorUnits(prizePoolMajor, 2),
    postFeeBaseMinor,
  );

  const mandatoryCharityMajor = multiplyMoney(
    postFeeBaseMajor,
    normalizedMandatoryCharityPercentage / 100,
  );
  const mandatoryCharityMinor = Math.min(
    toMinorUnits(mandatoryCharityMajor, 2),
    Math.max(postFeeBaseMinor - prizePoolMinor, 0),
  );

  const platformRevenueMinor = Math.max(
    postFeeBaseMinor - prizePoolMinor - mandatoryCharityMinor,
    0,
  );

  const mandatoryPlusOptionalCharityMinor = mandatoryCharityMinor + addonMinor;
  const totalCollectedMinor = baseMinor + addonMinor;

  const computedDistributedMinor =
    gatewayFeeMinor +
    prizePoolMinor +
    mandatoryCharityMinor +
    addonMinor +
    platformRevenueMinor;

  const deltaMinor = totalCollectedMinor - computedDistributedMinor;
  const adjustedPlatformRevenueMinor = platformRevenueMinor + deltaMinor;

  return {
    ruleSnapshot: {
      gatewayFeePercentage: normalizedGatewayFeePercentage,
      prizePoolPercentage: normalizedPrizePoolPercentage,
      mandatoryCharityPercentage: normalizedMandatoryCharityPercentage,
    },
    totals: {
      totalCollectedMinor,
      totalCollectedMajor: fromMinorUnits(totalCollectedMinor, 2),
      subscriptionBaseMinor: baseMinor,
      subscriptionBaseMajor: fromMinorUnits(baseMinor, 2),
      optionalDonationMinor: addonMinor,
      optionalDonationMajor: fromMinorUnits(addonMinor, 2),
      postFeeSubscriptionBaseMinor: postFeeBaseMinor,
      postFeeSubscriptionBaseMajor: fromMinorUnits(postFeeBaseMinor, 2),
    },
    allocations: {
      gatewayFeeMinor,
      gatewayFeeMajor: fromMinorUnits(gatewayFeeMinor, 2),
      prizePoolMinor,
      prizePoolMajor: fromMinorUnits(prizePoolMinor, 2),
      mandatoryCharityMinor,
      mandatoryCharityMajor: fromMinorUnits(mandatoryCharityMinor, 2),
      optionalCharityAddonMinor: addonMinor,
      optionalCharityAddonMajor: fromMinorUnits(addonMinor, 2),
      mandatoryPlusOptionalCharityMinor,
      mandatoryPlusOptionalCharityMajor: fromMinorUnits(
        mandatoryPlusOptionalCharityMinor,
        2,
      ),
      platformRevenueMinor: adjustedPlatformRevenueMinor,
      platformRevenueMajor: fromMinorUnits(adjustedPlatformRevenueMinor, 2),
    },
  };
};

export const computeOutstandingByCharity = ({
  totalAllocatedMinor = 0,
  totalAdjustedCreditMinor = 0,
  totalAdjustedDebitMinor = 0,
  totalPayoutCompletedMinor = 0,
}) => {
  const allocated = toNonNegativeInteger(totalAllocatedMinor);
  const adjustmentCredit = toNonNegativeInteger(totalAdjustedCreditMinor);
  const adjustmentDebit = toNonNegativeInteger(totalAdjustedDebitMinor);
  const paid = toNonNegativeInteger(totalPayoutCompletedMinor);

  const grossPayableMinor = allocated + adjustmentCredit;
  const netPayableMinor = Math.max(grossPayableMinor - adjustmentDebit, 0);
  const outstandingMinor = Math.max(netPayableMinor - paid, 0);

  return {
    grossPayableMinor,
    grossPayableMajor: fromMinorUnits(grossPayableMinor, 2),
    netPayableMinor,
    netPayableMajor: fromMinorUnits(netPayableMinor, 2),
    outstandingMinor,
    outstandingMajor: fromMinorUnits(outstandingMinor, 2),
  };
};

export const sumAmountMinorAsMajor = (values = []) => {
  const totalMinor = values.reduce(
    (acc, value) => acc + toNonNegativeInteger(value),
    0,
  );

  return {
    totalMinor,
    totalMajor: fromMinorUnits(totalMinor, 2),
  };
};

export const mergeMonetaryTotals = (values = []) => {
  const normalizedMajorValues = values.map((value) =>
    fromMinorUnits(toNonNegativeInteger(value), 2),
  );
  const totalMajor = addMoney(...normalizedMajorValues);

  return {
    totalMinor: toMinorUnits(totalMajor, 2),
    totalMajor,
  };
};

export const subtractMinorTotals = ({ leftMinor = 0, rightMinor = 0 }) => {
  const leftMajor = fromMinorUnits(toNonNegativeInteger(leftMinor), 2);
  const rightMajor = fromMinorUnits(toNonNegativeInteger(rightMinor), 2);
  const diffMajor = subtractMoney(leftMajor, rightMajor);
  const diffMinor = toMinorUnits(diffMajor, 2);

  return {
    totalMinor: diffMinor,
    totalMajor: diffMajor,
  };
};
