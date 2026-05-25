import type { ReactNode } from "react";

import { Badge, Card } from "@/components";

export const AdminMetricCard = ({
  label,
  value,
  description,
  badge,
  icon
}: {
  label: string;
  value: string;
  description: string;
  badge?: {
    label: string;
    tone?: "muted" | "success" | "warning" | "danger" | "info" | "accent" | "coral";
  };
  icon?: ReactNode;
}) => (
  <Card className="h-full bg-surface-elevated/95">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-4 font-display text-3xl text-foreground">{value}</p>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
      </div>
      {icon ? <div className="rounded-2xl bg-surface-soft p-3 text-accent">{icon}</div> : null}
    </div>
    {badge ? (
      <Badge className="mt-5" tone={badge.tone || "info"}>
        {badge.label}
      </Badge>
    ) : null}
  </Card>
);
