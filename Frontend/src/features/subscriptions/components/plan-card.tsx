import { ArrowRight, Check, Lock, Sparkles } from "lucide-react";

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import type { SubscriptionPlan } from "@/types";
import { formatCurrency } from "@/utils";

import { getPlanCadenceLabel, isMostPopularPlan } from "../checkout.helpers";

interface PlanCardProps {
  plan: SubscriptionPlan;
  selected?: boolean;
  highlighted?: boolean;
  disabled?: boolean;
  message?: string | null;
  onSelect?: (plan: SubscriptionPlan) => void;
}

export const PlanCard = ({
  plan,
  selected,
  highlighted,
  disabled,
  message,
  onSelect
}: PlanCardProps) => {
  const popular = highlighted || isMostPopularPlan(plan);

  return (
    <Card
      className={[
        "relative overflow-hidden transition-transform duration-200",
        selected ? "border-primary/50 bg-primary-soft/70 shadow-glow" : "",
        popular && !selected ? "border-accent/50 bg-mesh-warm shadow-glow" : "",
        disabled ? "opacity-80" : "hover:-translate-y-1"
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <CardHeader>
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Badge tone={popular ? "accent" : "muted"}>
              {popular ? "Most Popular" : plan.code}
            </Badge>
            {plan.isActive ? <Badge tone="success">Active</Badge> : null}
            {selected ? <Badge tone="success">Selected</Badge> : null}
          </div>
          <CardTitle>{plan.name}</CardTitle>
          <CardDescription>
            {plan.description ||
              "Admin-managed plan pricing with future coupon compatibility."}
          </CardDescription>
        </div>
        <div className="rounded-2xl bg-primary-soft p-3 text-primary">
          {disabled ? <Lock className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="font-display text-4xl text-foreground">
            {formatCurrency(plan.priceInr, plan.currency)}
          </p>
          <p className="text-sm text-muted-foreground">
            {getPlanCadenceLabel(plan)} • hierarchy level {plan.hierarchyLevel}
          </p>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </div>
        <Button
          className="mt-4 w-full"
          variant={selected ? "secondary" : popular ? "accent" : "primary"}
          disabled={disabled}
          onClick={() => onSelect?.(plan)}
        >
          {selected ? "Selected for checkout" : disabled ? "Unavailable" : "Choose plan"}
          {selected ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
        </Button>
      </CardContent>
    </Card>
  );
};
