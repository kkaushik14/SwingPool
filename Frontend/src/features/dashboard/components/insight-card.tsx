import type { ReactNode } from "react";

import { Badge, Card } from "@/components/ui";

export const InsightCard = ({
  label,
  value,
  accent,
  helper,
  icon
}: {
  label: string;
  value: string;
  accent?: string;
  helper?: string;
  icon?: ReactNode;
}) => {
  return (
    <Card className="h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">{label}</p>
          <p className="mt-3 font-display text-3xl text-foreground">{value}</p>
          {helper ? <p className="mt-2 text-sm text-muted-foreground">{helper}</p> : null}
        </div>
        <div className="rounded-2xl bg-surface-soft p-3 text-primary">{icon}</div>
      </div>
      {accent ? <Badge tone="accent" className="mt-5">{accent}</Badge> : null}
    </Card>
  );
};
