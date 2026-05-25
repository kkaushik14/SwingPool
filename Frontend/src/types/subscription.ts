import type { PaymentRecord } from "./payment";

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description?: string;
  priceInr: number;
  billingCycleDays: number;
  hierarchyLevel: number;
  currency: string;
  isDefault?: boolean;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface SubscriptionConfig {
  gracePeriodDays: number;
  mandatoryCharityPercentage: number;
  currency: string;
  metadata?: Record<string, unknown>;
  updatedAt?: string;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  planId?: string;
  planCode: string;
  planNameSnapshot: string;
  planPriceInrSnapshot: number;
  currency?: string;
  status: string;
  startAt?: string | null;
  endAt?: string | null;
  nextBillingAt?: string | null;
  gracePeriodEndsAt?: string | null;
  canceledAt?: string | null;
  charityId?: string | null;
  autoRenew?: boolean;
  mandatoryCharityPercentageSnapshot?: number;
  charityContributionInr?: number;
  latestCouponCode?: string | null;
  lastPaymentIntentId?: string | null;
  lastPaymentStatus?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionAllocationSplit {
  ruleSnapshot?: {
    gatewayFeePercentage?: number;
    prizePoolPercentage?: number;
    mandatoryCharityPercentage?: number;
  };
  totals?: {
    totalCollectedMinor?: number;
    totalCollectedMajor?: number;
    subscriptionBaseMinor?: number;
    subscriptionBaseMajor?: number;
    optionalDonationMinor?: number;
    optionalDonationMajor?: number;
    postFeeSubscriptionBaseMinor?: number;
    postFeeSubscriptionBaseMajor?: number;
  };
  allocations?: {
    gatewayFeeMinor?: number;
    gatewayFeeMajor?: number;
    prizePoolMinor?: number;
    prizePoolMajor?: number;
    mandatoryCharityMinor?: number;
    mandatoryCharityMajor?: number;
    optionalCharityAddonMinor?: number;
    optionalCharityAddonMajor?: number;
    mandatoryPlusOptionalCharityMinor?: number;
    mandatoryPlusOptionalCharityMajor?: number;
    platformRevenueMinor?: number;
    platformRevenueMajor?: number;
  };
}

export interface SubscriptionCreatePricing {
  baseAmountInr: number;
  discountInr: number;
  payableAmountInr: number;
  charityContributionInr: number;
  mandatoryCharityPercentage: number;
  optionalDonationInr?: number;
  splitPreview?: SubscriptionAllocationSplit;
}

export interface SubscriptionPricingSnapshot extends SubscriptionCreatePricing {
  totalPayableAmountInr?: number;
}

export interface SubscriptionCreateResult {
  subscription: SubscriptionRecord;
  payment: PaymentRecord;
  pricing: SubscriptionCreatePricing;
}
