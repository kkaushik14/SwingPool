import { CheckCircle2, CircleDashed, ArrowRight } from "lucide-react";

import { Badge, ButtonLink, Card } from "@/components";
import type { ReadinessChecklistItem } from "@/features/dashboard/dashboard.helpers";
import { routePaths } from "@/routes/paths";

export const ReadinessChecklistCard = ({
  items,
  completedCount,
  remainingCount
}: {
  items: ReadinessChecklistItem[];
  completedCount: number;
  remainingCount: number;
}) => {
  return (
    <Card className="space-y-5 bg-surface-elevated/95">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            Complete Missing Steps
          </p>
          <h3 className="mt-2 font-display text-2xl text-foreground">
            Readiness checklist
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Keep the account activation path simple: verification, charity, billing, then qualifying scores.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {remainingCount > 0 ? (
            <ButtonLink to={routePaths.onboarding} variant="secondary" size="sm">
              Open onboarding
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          ) : null}
          <Badge tone={remainingCount === 0 ? "success" : "warning"}>
            {remainingCount === 0 ? "All set" : `${remainingCount} left`}
          </Badge>
          <p className="text-sm text-muted-foreground">{completedCount} completed</p>
        </div>
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-surface-soft/80 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-2xl bg-surface-elevated p-2 shadow-soft">
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <CircleDashed className="h-5 w-5 text-warning" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
            {item.href ? (
              <ButtonLink
                to={item.href}
                className="md:self-center"
                variant={item.completed ? "secondary" : "accent"}
                size="sm"
              >
                {item.completed ? "Review" : "Complete now"}
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
};
