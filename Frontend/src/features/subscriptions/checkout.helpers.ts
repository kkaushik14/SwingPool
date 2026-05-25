import type {
  PaymentRecord,
  SubscriptionAllocationSplit,
  SubscriptionConfig,
  SubscriptionCreatePricing,
  SubscriptionPlan,
  SubscriptionPricingSnapshot,
  SubscriptionRecord
} from "@/types";

export const CHECKOUT_DONATION_PRESETS = [0, 49, 99, 199, 499] as const;
export const PAYMENT_STATUS_POLL_INTERVAL_MS = 5000;

type UpgradeTone = "info" | "success" | "warning";

export interface UpgradeMessage {
  tone: UpgradeTone;
  title: string;
  description: string;
  blocked: boolean;
}

export interface CheckoutSummary {
  baseAmountInr: number;
  discountInr: number;
  planChargeInr: number;
  optionalDonationInr: number;
  totalPayableInr: number;
  gatewayFeeInr: number | null;
  gatewayFeePercentage: number | null;
  mandatoryCharityInr: number | null;
  mandatoryCharityPercentage: number | null;
  totalCharityInr: number | null;
  prizePoolInr: number | null;
  platformRevenueInr: number | null;
  isExact: boolean;
  couponPending: boolean;
}

export interface PaymentJourneyState {
  kind: "success" | "processing" | "failure" | "attention";
  title: string;
  description: string;
}

const subscriptionPriority: Record<string, number> = {
  active: 6,
  grace_period: 5,
  pending_payment: 4,
  payment_failed: 3,
  expired: 2,
  canceled: 1
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const sortPlansForCheckout = (plans: SubscriptionPlan[]) =>
  [...plans].sort((left, right) => {
    if (left.hierarchyLevel !== right.hierarchyLevel) {
      return left.hierarchyLevel - right.hierarchyLevel;
    }

    return left.priceInr - right.priceInr;
  });

export const isMostPopularPlan = (plan: SubscriptionPlan) =>
  plan.code.toLowerCase() === "quarterly" || plan.name.toLowerCase() === "quarterly";

export const getPlanCadenceLabel = (plan: SubscriptionPlan) => {
  const code = plan.code.toLowerCase();

  if (code === "monthly") {
    return "Billed monthly";
  }

  if (code === "quarterly") {
    return "Billed every 3 months";
  }

  if (code === "yearly") {
    return "Billed yearly";
  }

  return `Billed every ${plan.billingCycleDays} days`;
};

export const getCurrentSubscription = (subscriptions: SubscriptionRecord[] = []) =>
  [...subscriptions].sort((left, right) => {
    const priorityDelta =
      (subscriptionPriority[right.status] || 0) - (subscriptionPriority[left.status] || 0);

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return (
      new Date(right.updatedAt || right.createdAt || 0).getTime() -
      new Date(left.updatedAt || left.createdAt || 0).getTime()
    );
  })[0] || null;

export const getUpgradeMessage = ({
  currentSubscription,
  currentPlan,
  selectedPlan
}: {
  currentSubscription?: SubscriptionRecord | null;
  currentPlan?: SubscriptionPlan | null;
  selectedPlan?: SubscriptionPlan | null;
}): UpgradeMessage | null => {
  if (!currentSubscription || !currentPlan || !selectedPlan) {
    return null;
  }

  if (!["active", "grace_period", "pending_payment"].includes(currentSubscription.status)) {
    return null;
  }

  if (selectedPlan.code === currentPlan.code) {
    return {
      tone: "info",
      title: "You’re reviewing your current plan.",
      description:
        "No billing change will happen unless you create a new payment-backed subscription cycle.",
      blocked: false
    };
  }

  if (selectedPlan.hierarchyLevel > currentPlan.hierarchyLevel) {
    return {
      tone: "success",
      title: "This qualifies as an upgrade.",
      description:
        "The backend supports upward-only upgrades and handles proration from unused value and time.",
      blocked: false
    };
  }

  return {
    tone: "warning",
    title: "Downgrades are not allowed in the current backend rules.",
    description:
      "Monthly can move upward to Quarterly or Yearly, and Quarterly can move upward to Yearly. Reverse movement is blocked.",
    blocked: true
  };
};

export const getGatewayFeePercentage = (config?: SubscriptionConfig | null) => {
  if (!config?.metadata || !isRecord(config.metadata)) {
    return null;
  }

  const direct = asNumber(config.metadata.gatewayFeePercentage);

  if (direct !== null) {
    return direct;
  }

  const charityConfig = isRecord(config.metadata.charity) ? config.metadata.charity : null;

  return charityConfig ? asNumber(charityConfig.gatewayFeePercentage) : null;
};

export const readSubscriptionPricingSnapshot = (
  subscription?: SubscriptionRecord | null
): SubscriptionPricingSnapshot | null => {
  if (!subscription?.metadata || !isRecord(subscription.metadata)) {
    return null;
  }

  const pricing = isRecord(subscription.metadata.pricing) ? subscription.metadata.pricing : null;

  if (!pricing) {
    return null;
  }

  const baseAmountInr = asNumber(pricing.baseAmountInr);
  const payableAmountInr = asNumber(pricing.payableAmountInr);

  if (baseAmountInr === null || payableAmountInr === null) {
    return null;
  }

  return {
    baseAmountInr,
    discountInr: asNumber(pricing.discountInr) || 0,
    payableAmountInr,
    charityContributionInr: asNumber(pricing.charityContributionInr) || 0,
    mandatoryCharityPercentage:
      asNumber(pricing.mandatoryCharityPercentage) ||
      subscription.mandatoryCharityPercentageSnapshot ||
      0,
    optionalDonationInr: asNumber(pricing.optionalDonationInr) || 0,
    totalPayableAmountInr: asNumber(pricing.totalPayableAmountInr) || payableAmountInr,
    splitPreview: isRecord(pricing.splitPreview)
      ? (pricing.splitPreview as SubscriptionAllocationSplit)
      : undefined
  };
};

export const buildCheckoutSummary = ({
  selectedPlan,
  config,
  optionalDonationInr,
  couponCode,
  pricing
}: {
  selectedPlan?: SubscriptionPlan | null;
  config?: SubscriptionConfig | null;
  optionalDonationInr?: number;
  couponCode?: string;
  pricing?: SubscriptionCreatePricing | SubscriptionPricingSnapshot | null;
}): CheckoutSummary | null => {
  if (!selectedPlan) {
    return null;
  }

  const safeDonation = Math.max(optionalDonationInr || 0, 0);
  const baseAmountInr = pricing?.baseAmountInr ?? selectedPlan.priceInr;
  const discountInr = pricing?.discountInr ?? 0;
  const planChargeInr = Math.max(baseAmountInr - discountInr, 0);
  const totalPayableInr = pricing?.payableAmountInr ?? roundMoney(planChargeInr + safeDonation);
  const splitPreview = pricing?.splitPreview;

  if (splitPreview?.allocations || splitPreview?.ruleSnapshot) {
    const gatewayFeeInr = splitPreview.allocations?.gatewayFeeMajor ?? null;
    const mandatoryCharityInr = splitPreview.allocations?.mandatoryCharityMajor ?? null;
    const totalCharityInr =
      splitPreview.allocations?.mandatoryPlusOptionalCharityMajor ??
      pricing?.charityContributionInr ??
      null;

    return {
      baseAmountInr,
      discountInr,
      planChargeInr,
      optionalDonationInr: pricing?.optionalDonationInr ?? safeDonation,
      totalPayableInr,
      gatewayFeeInr,
      gatewayFeePercentage: splitPreview.ruleSnapshot?.gatewayFeePercentage ?? null,
      mandatoryCharityInr,
      mandatoryCharityPercentage:
        splitPreview.ruleSnapshot?.mandatoryCharityPercentage ??
        pricing?.mandatoryCharityPercentage ??
        config?.mandatoryCharityPercentage ??
        null,
      totalCharityInr,
      prizePoolInr: splitPreview.allocations?.prizePoolMajor ?? null,
      platformRevenueInr: splitPreview.allocations?.platformRevenueMajor ?? null,
      isExact: true,
      couponPending: false
    };
  }

  const gatewayFeePercentage = getGatewayFeePercentage(config);
  const mandatoryCharityPercentage =
    pricing?.mandatoryCharityPercentage ?? config?.mandatoryCharityPercentage ?? null;

  if (gatewayFeePercentage !== null && mandatoryCharityPercentage !== null) {
    const gatewayFeeInr = roundMoney(planChargeInr * (gatewayFeePercentage / 100));
    const postFeeBaseInr = Math.max(planChargeInr - gatewayFeeInr, 0);
    const mandatoryCharityInr = roundMoney(
      postFeeBaseInr * (mandatoryCharityPercentage / 100)
    );

    return {
      baseAmountInr,
      discountInr,
      planChargeInr,
      optionalDonationInr: safeDonation,
      totalPayableInr,
      gatewayFeeInr,
      gatewayFeePercentage,
      mandatoryCharityInr,
      mandatoryCharityPercentage,
      totalCharityInr: roundMoney(mandatoryCharityInr + safeDonation),
      prizePoolInr: null,
      platformRevenueInr: null,
      isExact: false,
      couponPending: Boolean(couponCode?.trim())
    };
  }

  return {
    baseAmountInr,
    discountInr,
    planChargeInr,
    optionalDonationInr: safeDonation,
    totalPayableInr,
    gatewayFeeInr: null,
    gatewayFeePercentage,
    mandatoryCharityInr: null,
    mandatoryCharityPercentage,
    totalCharityInr: pricing?.charityContributionInr ?? null,
    prizePoolInr: null,
    platformRevenueInr: null,
    isExact: false,
    couponPending: Boolean(couponCode?.trim())
  };
};

export const findRelevantPayment = ({
  payments,
  subscription,
  paymentIntentId
}: {
  payments?: PaymentRecord[];
  subscription?: SubscriptionRecord | null;
  paymentIntentId?: string | null;
}) => {
  const targetIntentId = paymentIntentId || subscription?.lastPaymentIntentId;

  if (!targetIntentId) {
    return null;
  }

  return (
    payments?.find((payment) => payment.stripePaymentIntentId === targetIntentId) || null
  );
};

export const getPaymentJourneyState = ({
  payment,
  subscription
}: {
  payment?: PaymentRecord | null;
  subscription?: SubscriptionRecord | null;
}): PaymentJourneyState => {
  if (payment?.state === "succeeded" || subscription?.status === "active") {
    return {
      kind: "success",
      title: "Payment confirmed",
      description:
        "The backend has confirmed the final payment state and the subscription can now move on with activation rules."
    };
  }

  if (payment?.state === "retry_required") {
    return {
      kind: "attention",
      title: "Payment needs attention",
      description:
        "The backend detected a mismatch or retry condition. Avoid trusting the last redirect alone and review the payment state before trying again."
    };
  }

  if (
    payment &&
    ["failed", "cancelled", "timeout"].includes(payment.state)
  ) {
    return {
      kind: "failure",
      title: "Payment not confirmed",
      description:
        "The backend marked this payment as failed, cancelled, or timed out. The subscription will not activate until a new successful payment is confirmed."
    };
  }

  if (subscription?.status === "payment_failed") {
    return {
      kind: "failure",
      title: "Subscription is waiting for a new payment attempt",
      description:
        "The current subscription record has already moved into a failed-payment state, so you can safely retry from the billing page."
    };
  }

  return {
    kind: "processing",
    title: "Waiting for backend confirmation",
    description:
      "Payment callbacks can return before the backend finalizes webhook processing. Keep this page open or refresh until the final state lands."
  };
};

export const shouldPollPaymentState = ({
  payment,
  subscription
}: {
  payment?: PaymentRecord | null;
  subscription?: SubscriptionRecord | null;
}) =>
  payment?.state === "processing" ||
  payment?.state === "retry_required" ||
  subscription?.status === "pending_payment";
