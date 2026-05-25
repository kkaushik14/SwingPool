import { ArrowRight } from "lucide-react";

import {
  Badge,
  ButtonLink,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components";
import { routePaths } from "@/routes/paths";
import type { SubscriptionPlan } from "@/types";
import { formatCurrency } from "@/utils";

export const PublicPlanCard = ({
  plan,
  highlighted = false
}: {
  plan: SubscriptionPlan;
  highlighted?: boolean;
}) => {
  return (
    <Card className={highlighted ? "border-accent/40 bg-mesh-warm shadow-glow" : "bg-surface-elevated/90"}>
      <CardHeader>
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone={highlighted ? "accent" : "muted"}>
              {highlighted ? "Most balanced" : plan.name}
            </Badge>
            <Badge tone="info">{plan.billingCycleDays} days</Badge>
          </div>
          <CardTitle className="text-2xl">{plan.name}</CardTitle>
          <CardDescription>
            {plan.description ||
              "Current live plan pricing from the backend, ready for future coupon support."}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="font-display text-4xl text-foreground">
          {formatCurrency(plan.priceInr, plan.currency)}
        </p>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <p>Equal draw treatment across all paid plans.</p>
          <p>Activation still depends on payment success and profile verification.</p>
        </div>
        <ButtonLink
          to={routePaths.signup}
          className="mt-5 w-full"
          variant={highlighted ? "accent" : "primary"}
        >
          Join the Draw
          <ArrowRight className="h-4 w-4" />
        </ButtonLink>
      </CardContent>
    </Card>
  );
};
