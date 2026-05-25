import { ReceiptText } from "lucide-react";

import { Alert, Badge, Card } from "@/components";
import type { CheckoutSummary } from "@/features/subscriptions/checkout.helpers";
import type { SubscriptionPlan } from "@/types";
import { formatCurrency } from "@/utils";

const SummaryRow = ({
  label,
  value,
  hint
}: {
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="flex items-start justify-between gap-4">
    <div className="space-y-1">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
    <p className="text-right text-sm font-semibold text-foreground">{value}</p>
  </div>
);

export const CheckoutSummaryCard = ({
  selectedPlan,
  summary,
  currency = "INR",
  couponCode
}: {
  selectedPlan?: SubscriptionPlan | null;
  summary?: CheckoutSummary | null;
  currency?: string;
  couponCode?: string;
}) => {
  if (!selectedPlan || !summary) {
    return (
      <Card className="border-dashed bg-surface-elevated/70">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-surface-soft p-3 text-muted-foreground">
            <ReceiptText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Order summary</p>
            <p className="text-sm text-muted-foreground">
              Choose a plan to see the payment and impact breakdown.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-5 bg-surface-elevated/95">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            Order Summary
          </p>
          <h3 className="mt-2 font-display text-2xl text-foreground">
            {selectedPlan.name} checkout
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Transparent pricing, charity impact, and webhook-aware payment truth.
          </p>
        </div>
        <Badge tone={summary.isExact ? "success" : "info"}>
          {summary.isExact ? "Backend priced" : "Live estimate"}
        </Badge>
      </div>

      <div className="space-y-4 rounded-2xl border border-border/70 bg-surface-soft/80 p-4">
        <SummaryRow
          label="Plan price"
          value={formatCurrency(summary.baseAmountInr, currency)}
        />
        {summary.discountInr > 0 ? (
          <SummaryRow
            label="Coupon discount"
            value={`- ${formatCurrency(summary.discountInr, currency)}`}
          />
        ) : couponCode?.trim() ? (
          <SummaryRow
            label="Coupon"
            value={couponCode.trim().toUpperCase()}
            hint="Backend validation decides whether this coupon can be applied."
          />
        ) : null}
        <SummaryRow
          label="Optional charity add-on"
          value={formatCurrency(summary.optionalDonationInr, currency)}
        />
        <SummaryRow
          label="Gateway fee"
          value={
            summary.gatewayFeeInr !== null
              ? formatCurrency(summary.gatewayFeeInr, currency)
              : "Shown after backend pricing"
          }
          hint={
            summary.gatewayFeePercentage !== null
              ? `${summary.gatewayFeePercentage}% of the subscription base`
              : "This is deducted from the plan allocation, not added on top for the member."
          }
        />
        <SummaryRow
          label="Charity amount"
          value={
            summary.totalCharityInr !== null
              ? formatCurrency(summary.totalCharityInr, currency)
              : "Confirmed after payment setup"
          }
          hint={
            summary.mandatoryCharityPercentage !== null
              ? `${summary.mandatoryCharityPercentage}% mandatory share plus any add-on donation`
              : "Mandatory charity is calculated from the post-fee subscription base."
          }
        />
        {summary.prizePoolInr !== null ? (
          <SummaryRow
            label="Prize pool allocation"
            value={formatCurrency(summary.prizePoolInr, currency)}
          />
        ) : null}
        <div className="border-t border-border/70 pt-4">
          <SummaryRow
            label="Final payable today"
            value={formatCurrency(summary.totalPayableInr, currency)}
            hint="The frontend waits for backend-confirmed payment state before showing final success."
          />
        </div>
      </div>

      {!summary.isExact ? (
        <Alert tone="info" title="Final amounts are confirmed by the backend">
          {summary.couponPending
            ? "Coupon eligibility and any exact split values will be finalized only after the backend creates the payment attempt."
            : "If the backend exposes a richer split preview during payment setup, this summary will refresh with the exact gateway fee and impact numbers."}
        </Alert>
      ) : null}
    </Card>
  );
};
