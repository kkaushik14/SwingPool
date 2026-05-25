import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  CircleCheckBig,
  Info,
  TriangleAlert
} from "lucide-react";

import { cn } from "@/lib";

type BannerTone = "success" | "warning" | "danger" | "info";

const toneClasses: Record<BannerTone, string> = {
  success:
    "border-success/25 bg-success/10 text-foreground [--banner-icon:rgb(var(--color-success))]",
  warning:
    "border-warning/25 bg-warning/10 text-foreground [--banner-icon:rgb(var(--color-warning))]",
  danger:
    "border-danger/25 bg-danger/10 text-foreground [--banner-icon:rgb(var(--color-danger))]",
  info: "border-info/25 bg-info/10 text-foreground [--banner-icon:rgb(var(--color-info))]"
};

const toneIcons = {
  success: CircleCheckBig,
  warning: TriangleAlert,
  danger: AlertCircle,
  info: Info
} satisfies Record<BannerTone, typeof Info>;

export const TopBanner = ({
  tone = "info",
  eyebrow,
  title,
  description,
  action
}: {
  tone?: BannerTone;
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) => {
  const Icon = toneIcons[tone];

  return (
    <div
      className={cn(
        "mb-6 rounded-3xl border px-5 py-5 shadow-soft sm:px-6",
        toneClasses[tone]
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-surface-elevated/85 p-3 shadow-soft">
            <Icon className="h-5 w-5 text-[var(--banner-icon)]" />
          </div>
          <div className="max-w-3xl">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="mt-1 font-display text-2xl text-foreground">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {action ? (
          <div className="inline-flex items-center gap-2 rounded-pill border border-border/80 bg-surface-elevated/85 px-4 py-2 text-sm font-semibold text-foreground shadow-soft">
            {action}
            <ArrowRight className="h-4 w-4 text-accent" />
          </div>
        ) : null}
      </div>
    </div>
  );
};
