import { ArrowRight, CircleCheckBig, LoaderCircle, ShieldAlert, XCircle } from "lucide-react";

import { Alert, Badge, Button, ButtonLink, Card } from "@/components";
import { routePaths } from "@/routes/paths";
import type { PaymentJourneyState } from "@/features/subscriptions/checkout.helpers";
import type { PaymentRecord, SubscriptionPlan, SubscriptionRecord } from "@/types";
import { formatCurrency, formatDate, formatDateTime, toStatusLabel, toStatusTone } from "@/utils";

const stateVisual = {
  success: {
    icon: CircleCheckBig,
    tone: "success" as const,
    shell: "border-success/30 bg-success/10"
  },
  processing: {
    icon: LoaderCircle,
    tone: "info" as const,
    shell: "border-info/30 bg-info/10"
  },
  attention: {
    icon: ShieldAlert,
    tone: "warning" as const,
    shell: "border-warning/30 bg-warning/10"
  },
  failure: {
    icon: XCircle,
    tone: "danger" as const,
    shell: "border-danger/30 bg-danger/10"
  }
};

export const PaymentStatusPanel = ({
  state,
  payment,
  subscription,
  plan,
  pricingSummary,
  onRefresh,
  isRefreshing
}: {
  state: PaymentJourneyState;
  payment?: PaymentRecord | null;
  subscription?: SubscriptionRecord | null;
  plan?: SubscriptionPlan | null;
  pricingSummary?: Array<{ label: string; value: string }>;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) => {
  const visual = stateVisual[state.kind];
  const Icon = visual.icon;

  return (
    <Card className="space-y-5 bg-surface-elevated/95">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className={`rounded-3xl p-4 ${visual.shell}`}>
            <Icon
              className={`h-6 w-6 ${state.kind === "processing" ? "animate-spin" : ""}`}
            />
          </div>
          <div className="space-y-2">
            <Badge tone={visual.tone}>{toStatusLabel(payment?.state || subscription?.status)}</Badge>
            <h1 className="font-display text-3xl text-foreground">{state.title}</h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              {state.description}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {onRefresh ? (
            <Button variant="secondary" onClick={onRefresh} disabled={isRefreshing}>
              {isRefreshing ? "Refreshing..." : "Refresh status"}
            </Button>
          ) : null}
          <ButtonLink to={routePaths.subscriptions} variant="primary">
            Back to billing
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-3xl border border-border/70 bg-surface-soft/85 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">Subscription outcome</p>
            {subscription?.status ? (
              <Badge tone={toStatusTone(subscription.status)}>
                {toStatusLabel(subscription.status)}
              </Badge>
            ) : null}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Plan
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {plan?.name || subscription?.planNameSnapshot || "Plan pending"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Next billing
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {formatDate(subscription?.nextBillingAt)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Payment intent
              </p>
              <p className="mt-2 break-all text-sm text-foreground">
                {payment?.stripePaymentIntentId || subscription?.lastPaymentIntentId || "Pending"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Last update
              </p>
              <p className="mt-2 text-sm text-foreground">
                {formatDateTime(
                  payment?.stripeLastEventAt ||
                    payment?.updatedAt ||
                    subscription?.updatedAt ||
                    subscription?.createdAt
                )}
              </p>
            </div>
          </div>
          {payment?.stateReason ? (
            <Alert tone={visual.tone} title="Processor note">
              {payment.stateReason}
            </Alert>
          ) : null}
        </div>

        <div className="space-y-4 rounded-3xl border border-border/70 bg-surface-soft/85 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">Payment summary</p>
            {payment?.state ? (
              <Badge tone={toStatusTone(payment.state)}>{toStatusLabel(payment.state)}</Badge>
            ) : null}
          </div>
          <div className="space-y-4">
            {pricingSummary?.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
            {payment?.amount ? (
              <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-4">
                <p className="text-sm font-medium text-foreground">Payment record total</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(payment.amount / 100, payment.currency.toUpperCase())}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
};
