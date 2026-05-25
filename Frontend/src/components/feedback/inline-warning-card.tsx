import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowRightCircle,
  CircleCheckBig,
  Info,
  TriangleAlert
} from "lucide-react";

import { Badge, Card } from "@/components/ui";
import { cn } from "@/lib";

type InlineNoticeTone = "success" | "warning" | "danger" | "info";

const toneClasses: Record<InlineNoticeTone, string> = {
  success: "border-success/30 bg-success/10 shadow-soft",
  warning: "border-warning/30 bg-warning/10 shadow-soft",
  danger: "border-danger/30 bg-danger/10 shadow-soft",
  info: "border-info/30 bg-info/10 shadow-soft"
};

const toneIconClasses: Record<InlineNoticeTone, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info"
};

const toneIcons = {
  success: CircleCheckBig,
  warning: TriangleAlert,
  danger: AlertCircle,
  info: Info
} satisfies Record<InlineNoticeTone, typeof Info>;

export const InlineWarningCard = ({
  title,
  description,
  label = "Attention needed",
  action,
  tone = "warning"
}: {
  title: string;
  description: string;
  label?: string;
  action?: ReactNode;
  tone?: InlineNoticeTone;
}) => {
  const Icon = toneIcons[tone];

  return (
    <Card className={cn(toneClasses[tone])}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "rounded-2xl bg-surface-elevated/85 p-3 shadow-soft",
              toneIconClasses[tone]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <Badge tone={tone}>{label}</Badge>
            <h3 className="font-display text-xl text-foreground">{title}</h3>
            <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {action ? (
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            {action}
            <ArrowRightCircle className={cn("h-4 w-4", toneIconClasses[tone])} />
          </div>
        ) : null}
      </div>
    </Card>
  );
};
