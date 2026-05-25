import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearchParams } from "react-router-dom";

import { Alert, EmptyState, SectionHeading } from "@/components";
import { queryKeys } from "@/constants";
import {
  buildCheckoutSummary,
  findRelevantPayment,
  getPaymentJourneyState,
  PAYMENT_STATUS_POLL_INTERVAL_MS,
  PaymentStatusPanel,
  readSubscriptionPricingSnapshot,
  shouldPollPaymentState
} from "@/features/subscriptions";
import { paymentsService, subscriptionsService } from "@/services";
import type { PaymentRecord, SubscriptionCreatePricing, SubscriptionPlan, SubscriptionRecord } from "@/types";
import { formatCurrency } from "@/utils";

interface OutcomeLocationState {
  createdPayment?: PaymentRecord;
  createdPricing?: SubscriptionCreatePricing;
  createdSubscription?: SubscriptionRecord;
}

const createPlanFromSnapshot = (
  subscription?: SubscriptionRecord | null,
  plans?: SubscriptionPlan[]
) => {
  if (!subscription) {
    return null;
  }

  return (
    plans?.find((plan) => plan.code === subscription.planCode) || {
      id: subscription.planId || subscription.id,
      code: subscription.planCode,
      name: subscription.planNameSnapshot,
      priceInr: subscription.planPriceInrSnapshot,
      billingCycleDays: 0,
      hierarchyLevel: 0,
      currency: subscription.currency || "INR"
    }
  );
};

export const PaymentOutcomeView = ({
  variant
}: {
  variant: "success" | "failure";
}) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const locationState = (location.state as OutcomeLocationState | null) || null;
  const subscriptionId = searchParams.get("subscriptionId");
  const paymentIntentId = searchParams.get("paymentIntentId");

  const subscriptionsQuery = useQuery({
    queryKey: queryKeys.mySubscriptions,
    queryFn: async () => (await subscriptionsService.listMine()).data
  });
  const paymentsQuery = useQuery({
    queryKey: queryKeys.myPayments,
    queryFn: async () => (await paymentsService.listMine()).data
  });
  const plansQuery = useQuery({
    queryKey: queryKeys.plans,
    queryFn: async () => (await subscriptionsService.listPlans()).data
  });

  const subscription =
    locationState?.createdSubscription ||
    subscriptionsQuery.data?.find((item) => item.id === subscriptionId) ||
    subscriptionsQuery.data?.find(
      (item) => paymentIntentId && item.lastPaymentIntentId === paymentIntentId
    ) ||
    null;
  const payment =
    locationState?.createdPayment ||
    findRelevantPayment({
      payments: paymentsQuery.data,
      subscription,
      paymentIntentId
    });
  const shouldPoll = shouldPollPaymentState({ payment, subscription });
  const displayPlan = createPlanFromSnapshot(subscription, plansQuery.data);
  const pricing =
    locationState?.createdPricing || readSubscriptionPricingSnapshot(subscription);
  const summary = buildCheckoutSummary({
    selectedPlan: displayPlan,
    optionalDonationInr: pricing?.optionalDonationInr,
    pricing
  });
  const journeyState = getPaymentJourneyState({ payment, subscription });

  const pricingSummary = summary
    ? [
        { label: "Plan price", value: formatCurrency(summary.baseAmountInr) },
        ...(summary.discountInr > 0
          ? [{ label: "Coupon discount", value: `- ${formatCurrency(summary.discountInr)}` }]
          : []),
        { label: "Optional charity add-on", value: formatCurrency(summary.optionalDonationInr) },
        ...(summary.gatewayFeeInr !== null
          ? [{ label: "Gateway fee", value: formatCurrency(summary.gatewayFeeInr) }]
          : []),
        ...(summary.totalCharityInr !== null
          ? [{ label: "Charity amount", value: formatCurrency(summary.totalCharityInr) }]
          : []),
        { label: "Final payable", value: formatCurrency(summary.totalPayableInr) }
      ]
    : [];

  useQuery({
    queryKey: [...queryKeys.myPayments, "poll", payment?.stripePaymentIntentId || "none"],
    queryFn: async () => {
      await Promise.all([paymentsQuery.refetch(), subscriptionsQuery.refetch()]);
      return true;
    },
    enabled: shouldPoll,
    refetchInterval: PAYMENT_STATUS_POLL_INTERVAL_MS
  });

  const alertTone =
    journeyState.kind === "success"
      ? "success"
      : journeyState.kind === "failure"
        ? "danger"
        : journeyState.kind === "attention"
          ? "warning"
          : "info";

  const alertTitle =
    variant === "success"
      ? journeyState.kind === "success"
        ? "The success return now matches backend confirmation."
        : "The success return reached the app before final backend truth."
      : journeyState.kind === "failure"
        ? "The failed or cancelled return matches backend confirmation."
        : "The failure return does not yet represent final backend truth.";

  if (!subscriptionId && !paymentIntentId && !locationState?.createdSubscription) {
    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Payment status"
          title="We need a payment reference to show the right result."
          description="Open this page from the checkout return flow or the billing workspace so we can match the backend payment record."
        />
        <EmptyState
          eyebrow="Missing payment context"
          title="No payment reference found"
          description="This view expects a subscription id or payment intent id in the URL so it can read the backend-tracked status."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={variant === "success" ? "Payment success return" : "Payment failure return"}
        title={
          variant === "success"
            ? "Processing the success callback through backend truth"
            : "Reviewing the failed or cancelled callback safely"
        }
        description="This page never trusts a redirect alone. It compares the callback path with the backend payment record and subscription state before showing a final outcome."
      />

      <Alert tone={alertTone} title={alertTitle}>
        {journeyState.description}
      </Alert>

      <PaymentStatusPanel
        state={journeyState}
        payment={payment}
        subscription={subscription}
        plan={displayPlan}
        pricingSummary={pricingSummary}
        onRefresh={() => {
          void Promise.all([paymentsQuery.refetch(), subscriptionsQuery.refetch(), plansQuery.refetch()]);
        }}
        isRefreshing={
          paymentsQuery.isRefetching || subscriptionsQuery.isRefetching || plansQuery.isRefetching
        }
      />
    </div>
  );
};
