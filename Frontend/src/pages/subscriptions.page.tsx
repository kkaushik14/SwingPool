import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, HeartHandshake, ShieldCheck, WalletCards } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  InlineWarningCard,
  Input,
  Label,
  OperationalStatePanel,
  PageSectionSkeleton,
  RetryButton,
  SectionHeading,
  Spinner,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "@/components";
import { queryKeys } from "@/constants";
import {
  AccountInlineStatusCards,
  selectAccountStatusNotices
} from "@/features/notifications";
import {
  buildCheckoutSummary,
  CHECKOUT_DONATION_PRESETS,
  CheckoutSummaryCard,
  findRelevantPayment,
  getCurrentSubscription,
  getPlanCadenceLabel,
  getUpgradeMessage,
  isMostPopularPlan,
  PAYMENT_STATUS_POLL_INTERVAL_MS,
  PlanCard,
  shouldPollPaymentState,
  sortPlansForCheckout
} from "@/features/subscriptions";
import { useOnlineStatus } from "@/hooks";
import { queryClient } from "@/lib";
import { routePaths } from "@/routes/paths";
import { charitiesService, paymentsService, subscriptionsService, usersService } from "@/services";
import type { CharityRecord, PaymentRecord, SubscriptionPlan } from "@/types";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getErrorMessage,
  toStatusLabel,
  toStatusTone
} from "@/utils";

const checkoutSchema = z.object({
  planCode: z.string().min(1, "Choose a plan to continue."),
  charityId: z.string().min(1, "Choose the charity that should receive this payment's impact share."),
  couponCode: z.string().trim().max(40, "Coupon codes should stay under 40 characters.").optional(),
  optionalDonationInr: z.coerce
    .number()
    .int("Donation amounts should be whole rupees.")
    .min(0, "Donation amounts cannot be negative.")
    .max(100000, "Keep the add-on donation at or below ₹100000 for now."),
  saveCharitySelection: z.boolean().default(true)
});

type CheckoutSchema = z.infer<typeof checkoutSchema>;
type CheckoutSchemaInput = z.input<typeof checkoutSchema>;

const getStatusRoute = ({
  subscriptionId,
  paymentIntentId,
  failure
}: {
  subscriptionId: string;
  paymentIntentId?: string | null;
  failure?: boolean;
}) => {
  const params = new URLSearchParams();
  params.set("subscriptionId", subscriptionId);

  if (paymentIntentId) {
    params.set("paymentIntentId", paymentIntentId);
  }

  return `${failure ? routePaths.paymentFailure : routePaths.paymentSuccess}?${params.toString()}`;
};

const selectDefaultCharity = (charities: CharityRecord[] = [], currentCharityId?: string) =>
  currentCharityId ||
  charities.find((charity) => charity.isFeatured)?.id ||
  charities[0]?.id ||
  "";

const selectDefaultPlanCode = (plans: SubscriptionPlan[] = []) =>
  plans.find((plan) => isMostPopularPlan(plan))?.code || plans[0]?.code || "";

export const SubscriptionsPage = () => {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const form = useForm<CheckoutSchemaInput, unknown, CheckoutSchema>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      planCode: "",
      charityId: "",
      couponCode: "",
      optionalDonationInr: 0,
      saveCharitySelection: true
    }
  });

  const plansQuery = useQuery({
    queryKey: queryKeys.plans,
    queryFn: async () => (await subscriptionsService.listPlans()).data
  });
  const configQuery = useQuery({
    queryKey: queryKeys.subscriptionConfig,
    queryFn: async () => (await subscriptionsService.getConfig()).data
  });
  const mySubscriptionsQuery = useQuery({
    queryKey: queryKeys.mySubscriptions,
    queryFn: async () => (await subscriptionsService.listMine()).data
  });
  const profileStatusQuery = useQuery({
    queryKey: queryKeys.profileStatus,
    queryFn: async () => (await usersService.getProfileStatus()).data
  });
  const charitiesQuery = useQuery({
    queryKey: queryKeys.charities,
    queryFn: async () => (await charitiesService.list()).data
  });
  const charitySelectionQuery = useQuery({
    queryKey: queryKeys.myCharitySelection,
    queryFn: async () => (await charitiesService.getMySelection()).data
  });

  const currentSubscription = useMemo(
    () => getCurrentSubscription(mySubscriptionsQuery.data || []),
    [mySubscriptionsQuery.data]
  );

  const paymentsQuery = useQuery({
    queryKey: queryKeys.myPayments,
    queryFn: async () => (await paymentsService.listMine()).data,
    refetchInterval: ({ state }) => {
      const payments = (state.data as PaymentRecord[] | undefined) || [];
      const pendingPayment = findRelevantPayment({
        payments,
        subscription: currentSubscription
      });

      return shouldPollPaymentState({
        payment: pendingPayment,
        subscription: currentSubscription
      })
        ? PAYMENT_STATUS_POLL_INTERVAL_MS
        : false;
    }
  });

  const sortedPlans = useMemo(
    () => sortPlansForCheckout(plansQuery.data || []),
    [plansQuery.data]
  );
  const currentPlan =
    sortedPlans.find((plan) => plan.code === currentSubscription?.planCode) || null;
  const selectedPlanCode = form.watch("planCode");
  const selectedCharityId = form.watch("charityId");
  const couponCode = form.watch("couponCode");
  const optionalDonationValue = form.watch("optionalDonationInr");
  const optionalDonationInr =
    typeof optionalDonationValue === "number" && Number.isFinite(optionalDonationValue)
      ? optionalDonationValue
      : 0;
  const selectedPlan =
    sortedPlans.find((plan) => plan.code === selectedPlanCode) || null;
  const pendingPayment = findRelevantPayment({
    payments: paymentsQuery.data,
    subscription: currentSubscription
  });
  const previewSummary = buildCheckoutSummary({
    selectedPlan,
    config: configQuery.data,
    optionalDonationInr,
    couponCode,
    pricing: null
  });
  const upgradeMessage = getUpgradeMessage({
    currentSubscription,
    currentPlan,
    selectedPlan
  });
  const hasBlockingPendingPayment = shouldPollPaymentState({
    payment: pendingPayment,
    subscription: currentSubscription
  });
  const accountNotices = selectAccountStatusNotices({
    profileStatus: profileStatusQuery.data,
    subscription: currentSubscription
  });
  const canCreateSubscription = Boolean(
    profileStatusQuery.data?.eligibleForSubscription &&
      selectedPlan &&
      selectedCharityId &&
      !upgradeMessage?.blocked &&
      !hasBlockingPendingPayment &&
      isOnline
  );
  const criticalQueries = [
    plansQuery,
    configQuery,
    profileStatusQuery,
    charitiesQuery,
    charitySelectionQuery
  ];
  const hasCriticalData = criticalQueries.some((query) => query.data !== undefined);
  const isInitialLoading =
    criticalQueries.some((query) => query.isPending) && !hasCriticalData;
  const hasBlockingError =
    criticalQueries.some((query) => query.isError) && !hasCriticalData;
  const retryBillingQueries = async () => {
    await Promise.all(criticalQueries.map((query) => query.refetch()));
  };

  useEffect(() => {
    if (!form.getValues("planCode") && sortedPlans.length) {
      form.setValue("planCode", selectDefaultPlanCode(sortedPlans), {
        shouldValidate: true
      });
    }
  }, [form, sortedPlans]);

  useEffect(() => {
    if (!form.getValues("charityId") && charitiesQuery.data?.length) {
      form.setValue(
        "charityId",
        selectDefaultCharity(charitiesQuery.data, charitySelectionQuery.data?.charityId),
        {
          shouldValidate: true
        }
      );
    }
  }, [charitiesQuery.data, charitySelectionQuery.data?.charityId, form]);

  const createSubscriptionMutation = useMutation({
    mutationFn: async (values: CheckoutSchema) => {
      const normalizedCouponCode = values.couponCode?.trim() || undefined;

      if (
        values.saveCharitySelection &&
        values.charityId &&
        values.charityId !== charitySelectionQuery.data?.charityId
      ) {
        await charitiesService.setMySelection(
          values.charityId,
          "Updated from the billing checkout surface."
        );
      }

      return subscriptionsService.create({
        planCode: values.planCode,
        charityId: values.charityId,
        couponCode: normalizedCouponCode,
        optionalDonationInr: values.optionalDonationInr,
        metadata: {
          source: "frontend_checkout"
        }
      });
    },
    meta: {
      toastOnError: true,
      toastTitle: "We could not start the payment flow"
    },
    onSuccess: async (response) => {
      const { subscription, payment } = response.data;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.mySubscriptions }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myPayments }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myCharitySelection })
      ]);

      navigate(
        getStatusRoute({
          subscriptionId: subscription.id,
          paymentIntentId: payment.stripePaymentIntentId
        }),
        {
          state: {
            createdSubscription: subscription,
            createdPayment: payment,
            createdPricing: response.data.pricing
          }
        }
      );
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await createSubscriptionMutation.mutateAsync(values);
  });

  const recentPayments = useMemo(
    () =>
      [...(paymentsQuery.data || [])].sort(
        (left, right) =>
          new Date(right.updatedAt || right.createdAt || 0).getTime() -
          new Date(left.updatedAt || left.createdAt || 0).getTime()
      ),
    [paymentsQuery.data]
  );

  const paymentHistory = useMemo(
    () =>
      recentPayments.slice(0, 8),
    [recentPayments]
  );

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Billing"
        title="Choose a plan, keep charity in the checkout, and let backend truth decide activation"
        description="Monthly, Quarterly, and Yearly plans stay equal for draw eligibility. This surface keeps plan choice, optional giving, and payment-state visibility in one premium checkout flow."
      />

      {!isOnline && hasCriticalData ? (
        <Alert tone="warning" title="Offline view">
          Checkout actions are paused until the connection returns. You can still review plans,
          charity choices, and your last synced billing state.
        </Alert>
      ) : null}

      {isInitialLoading ? <PageSectionSkeleton cards={3} rows={4} /> : null}

      {!isInitialLoading && hasBlockingError ? (
        <OperationalStatePanel
          action={<RetryButton onClick={() => void retryBillingQueries()} />}
          description="Plans, billing config, or charity data could not be loaded cleanly from the backend."
          state="error"
          title="Billing data is temporarily unavailable"
        />
      ) : null}

      {!isInitialLoading && !hasBlockingError ? (
        <>
      <AccountInlineStatusCards notices={accountNotices} surface="billing" />

      {!profileStatusQuery.data?.eligibleForSubscription ? (
        <InlineWarningCard
          label="Activation gate"
          title="Activation is still gated by verification."
          description="The backend requires email verification, completed profile verification, and confirmed payment before the subscription can become active."
          action={
            <Link to={routePaths.profile} className="underline-offset-4 hover:underline">
              Complete profile steps
            </Link>
          }
        />
      ) : null}

      {hasBlockingPendingPayment && currentSubscription ? (
        <InlineWarningCard
          label="Payment in progress"
          title="A payment attempt is already waiting for backend confirmation."
          description="To avoid creating overlapping pending records, this checkout stays read-only until the current Stripe-backed payment settles or times out."
          action={
            <Link
              to={getStatusRoute({
                subscriptionId: currentSubscription.id,
                paymentIntentId: currentSubscription.lastPaymentIntentId
              })}
              className="underline-offset-4 hover:underline"
            >
              View payment status
            </Link>
          }
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden bg-mesh-warm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <Badge tone="accent">Join the Draw</Badge>
                <h2 className="font-display text-4xl text-foreground">
                  Pick the rhythm that feels right, not the one that changes your odds.
                </h2>
                <p className="text-sm leading-7 text-muted-foreground">
                  Quarterly is the most popular option because it balances value and continuity, but all plans receive the same monthly draw treatment once the backend confirms eligibility.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-border/70 bg-surface-elevated/85 p-4 shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                    Activation gates
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Email verification, profile verification, and confirmed payment.
                  </p>
                </div>
                <div className="rounded-3xl border border-border/70 bg-surface-elevated/85 p-4 shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                    Upgrade rule
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Upgrades only move upward, with backend proration for unused value and time.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-3">
            {sortedPlans.map((plan) => {
              const planUpgradeMessage = getUpgradeMessage({
                currentSubscription,
                currentPlan,
                selectedPlan: plan
              });

              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  selected={plan.code === selectedPlanCode}
                  highlighted={isMostPopularPlan(plan)}
                  disabled={Boolean(planUpgradeMessage?.blocked)}
                  message={planUpgradeMessage?.description || getPlanCadenceLabel(plan)}
                  onSelect={(nextPlan) =>
                    form.setValue("planCode", nextPlan.code, {
                      shouldDirty: true,
                      shouldValidate: true
                    })
                  }
                />
              );
            })}
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <Card className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary-soft p-3 text-primary">
                  <WalletCards className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-foreground">Current billing view</h3>
                  <p className="text-sm text-muted-foreground">
                    Clear upgrade messaging, current status, and draw-safe guardrails.
                  </p>
                </div>
              </div>

              {upgradeMessage ? (
                <Alert tone={upgradeMessage.tone} title={upgradeMessage.title}>
                  {upgradeMessage.description}
                </Alert>
              ) : null}

              {currentSubscription ? (
                <div className="space-y-4 rounded-3xl border border-border/70 bg-surface-soft/80 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {currentSubscription.planNameSnapshot}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Next billing {formatDate(currentSubscription.nextBillingAt)}
                      </p>
                    </div>
                    <Badge tone={toStatusTone(currentSubscription.status)}>
                      {toStatusLabel(currentSubscription.status)}
                    </Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Charity share snapshot
                      </p>
                      <p className="mt-2 text-sm text-foreground">
                        {typeof currentSubscription.charityContributionInr === "number"
                          ? formatCurrency(
                              currentSubscription.charityContributionInr,
                              currentSubscription.currency || "INR"
                            )
                          : "Shown once the backend prices the payment"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Last payment state
                      </p>
                      <p className="mt-2 text-sm text-foreground">
                        {toStatusLabel(currentSubscription.lastPaymentStatus)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Renewal / expiry
                      </p>
                      <p className="mt-2 text-sm text-foreground">
                        {currentSubscription.endAt
                          ? `Ends ${formatDate(currentSubscription.endAt)}`
                          : "Active window will appear after confirmation"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Cancellation
                      </p>
                      <p className="mt-2 text-sm text-foreground">
                        {currentSubscription.canceledAt
                          ? `Cancelled ${formatDate(currentSubscription.canceledAt)}`
                          : "Not cancelled"}
                      </p>
                    </div>
                  </div>
                  {currentSubscription.status === "grace_period" ? (
                    <Alert tone="warning" title="Grace-period warning">
                      Renewal has failed and the backend is currently holding this subscription in grace until {formatDate(currentSubscription.gracePeriodEndsAt)}.
                    </Alert>
                  ) : null}
                  {currentSubscription.status === "canceled" ? (
                    <Alert tone="info" title="Cancellation is immediate">
                      This subscription has been cancelled. Draw eligibility stops once the active billing window closes and no renewed active state exists.
                    </Alert>
                  ) : null}
                  {currentSubscription.status === "payment_failed" ? (
                    <Alert tone="warning" title="Payment retry needed">
                      The last payment did not settle successfully. Start a fresh checkout only after reviewing the payment history below.
                    </Alert>
                  ) : null}
                  {currentSubscription.status === "expired" ? (
                    <Alert tone="danger" title="Subscription expired">
                      This subscription has expired, so billing and draw readiness both need a new successful payment-backed activation.
                    </Alert>
                  ) : null}
                </div>
              ) : (
                <EmptyState
                  eyebrow="No active billing yet"
                  title="Your first subscription starts here."
                  description="Choose a plan, keep the charity inside this page, and let the backend create the pending payment record that Stripe will later confirm."
                />
              )}
            </Card>

            <Card className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-accent-soft p-3 text-accent-foreground">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-foreground">Recent payment states</h3>
                  <p className="text-sm text-muted-foreground">
                    Success on the client is never enough. These are backend-tracked outcomes.
                  </p>
                </div>
              </div>
              {recentPayments.slice(0, 4).length ? (
                <div className="space-y-3">
                  {recentPayments.slice(0, 4).map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-3xl border border-border/70 bg-surface-soft/80 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(payment.amount / 100, payment.currency.toUpperCase())}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Updated {formatDateTime(payment.updatedAt || payment.createdAt)}
                          </p>
                        </div>
                        <Badge tone={toStatusTone(payment.state)}>
                          {toStatusLabel(payment.state)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No payment attempts yet. Your first payment record appears here after checkout begins.
                </p>
              )}
            </Card>
          </div>

          <Card className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl text-foreground">Payment history</h3>
                <p className="text-sm text-muted-foreground">
                  This history comes straight from backend payment records, so status always reflects the same source the webhook flow uses.
                </p>
              </div>
              <Badge tone="info">{paymentHistory.length} shown</Badge>
            </div>
            {paymentHistory.length ? (
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Date</TableHeaderCell>
                    <TableHeaderCell>Amount</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Reason</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {paymentHistory.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDateTime(payment.updatedAt || payment.createdAt)}</TableCell>
                      <TableCell>
                        {formatCurrency(payment.amount / 100, payment.currency.toUpperCase())}
                      </TableCell>
                      <TableCell>
                        <Badge tone={toStatusTone(payment.state)}>
                          {toStatusLabel(payment.state)}
                        </Badge>
                      </TableCell>
                      <TableCell>{payment.stateReason || "No additional note"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                Payment history will appear here after the first backend-tracked payment attempt is created.
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <Card className="space-y-6 bg-surface-elevated/95">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                Secure Checkout
              </p>
              <h3 className="mt-2 font-display text-3xl text-foreground">
                Plan, charity, and payment setup in one page
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Account activation still waits for successful email verification, completed profile verification, and confirmed payment from the backend.
              </p>
            </div>

            <Stepper
              steps={[
                {
                  title: "Plan",
                  description: selectedPlan
                    ? `${selectedPlan.name} selected`
                    : "Choose Monthly, Quarterly, or Yearly.",
                  state: selectedPlan ? "complete" : "current"
                },
                {
                  title: "Charity",
                  description: selectedCharityId
                    ? "Impact destination selected inside checkout."
                    : "Choose the charity for this payment's impact.",
                  state: selectedCharityId ? "complete" : selectedPlan ? "current" : "upcoming"
                },
                {
                  title: "Payment",
                  description:
                    "The backend creates a pending payment record and waits for webhook truth.",
                  state:
                    selectedPlan && selectedCharityId && profileStatusQuery.data?.eligibleForSubscription
                      ? "current"
                      : "upcoming"
                }
              ]}
            />

            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="couponCode" className="mb-0">
                    Coupon code
                  </Label>
                  <Badge tone="muted">Optional</Badge>
                </div>
                <Input
                  id="couponCode"
                  placeholder="Have a coupon? Enter it here"
                  {...form.register("couponCode")}
                />
                <p className="text-xs text-muted-foreground">
                  Coupon application is placeholder-ready here and always validated by the backend.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label className="mb-0">Choose your charity</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      This stays inside payment setup and can also become your default for future renewals.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-pill border border-border px-3 py-2 text-xs text-muted-foreground">
                    <HeartHandshake className="h-3.5 w-3.5" />
                    Future payments only
                  </div>
                </div>
                <div className="grid gap-3">
                  {(charitiesQuery.data || []).map((charity) => {
                    const selected = charity.id === selectedCharityId;

                    return (
                      <button
                        key={charity.id}
                        type="button"
                        className={[
                          "rounded-3xl border px-4 py-4 text-left transition-colors",
                          selected
                            ? "border-primary/50 bg-primary-soft/60"
                            : "border-border/70 bg-surface-soft/70 hover:border-accent/40"
                        ].join(" ")}
                        onClick={() =>
                          form.setValue("charityId", charity.id, {
                            shouldDirty: true,
                            shouldValidate: true
                          })
                        }
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{charity.name}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {charity.mission}
                            </p>
                          </div>
                          {selected ? <Badge tone="success">Selected</Badge> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {form.formState.errors.charityId ? (
                  <p className="text-sm text-danger">
                    {form.formState.errors.charityId.message}
                  </p>
                ) : null}
                <label className="flex items-start gap-3 rounded-2xl border border-border/70 bg-surface-soft/70 px-4 py-3 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-border text-primary"
                    {...form.register("saveCharitySelection")}
                  />
                  <span>
                    Save this as my default charity choice for future subscription payments.
                  </span>
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="optionalDonationInr">Optional add-on donation</Label>
                  <Input
                    id="optionalDonationInr"
                    type="number"
                    min={0}
                    step={1}
                    {...form.register("optionalDonationInr", { valueAsNumber: true })}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    This extra amount passes through fully to the chosen charity and is added on top of the plan price.
                  </p>
                  {form.formState.errors.optionalDonationInr ? (
                    <p className="mt-2 text-sm text-danger">
                      {form.formState.errors.optionalDonationInr.message}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {CHECKOUT_DONATION_PRESETS.map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant={optionalDonationInr === amount ? "accent" : "secondary"}
                      size="sm"
                      onClick={() =>
                        form.setValue("optionalDonationInr", amount, {
                          shouldDirty: true,
                          shouldValidate: true
                        })
                      }
                    >
                      {amount === 0 ? "No add-on" : `+ ${formatCurrency(amount)}`}
                    </Button>
                  ))}
                </div>
              </div>

              {createSubscriptionMutation.error ? (
                <Alert tone="danger" title="Checkout could not start">
                  {getErrorMessage(createSubscriptionMutation.error)}
                </Alert>
              ) : null}

              <Button
                type="submit"
                className="w-full"
                variant="accent"
                disabled={!canCreateSubscription || createSubscriptionMutation.isPending}
              >
                {createSubscriptionMutation.isPending ? <Spinner /> : null}
                {createSubscriptionMutation.isPending
                  ? "Creating secure payment..."
                  : "Continue to secure payment"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-xs leading-6 text-muted-foreground">
                The client never marks this as paid on its own. We wait for the backend to confirm the final Stripe-backed state.
              </p>
            </form>
          </Card>

          <CheckoutSummaryCard
            selectedPlan={selectedPlan}
            summary={previewSummary}
            couponCode={couponCode}
          />
        </div>
      </div>
        </>
      ) : null}
    </div>
  );
};
