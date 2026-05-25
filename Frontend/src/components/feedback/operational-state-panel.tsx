import type { ReactNode } from "react";
import {
  CircleCheckBig,
  CloudOff,
  Inbox,
  RefreshCcw,
  ShieldAlert,
  TriangleAlert
} from "lucide-react";

import { Button, Card, Spinner } from "@/components/ui";
import { cn } from "@/lib";

type OperationalState = "loading" | "empty" | "error" | "offline" | "success";

const toneClasses: Record<OperationalState, string> = {
  loading: "border-border/70 bg-surface-elevated/95 text-foreground",
  empty: "border-border/70 bg-surface-elevated/95 text-foreground",
  error: "border-danger/30 bg-danger/10 text-foreground",
  offline: "border-warning/30 bg-warning/10 text-foreground",
  success: "border-success/30 bg-success/10 text-foreground"
};

const stateIcons = {
  loading: RefreshCcw,
  empty: Inbox,
  error: ShieldAlert,
  offline: CloudOff,
  success: CircleCheckBig
} satisfies Record<OperationalState, typeof Inbox>;

export interface OperationalStatePanelProps {
  state: OperationalState;
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  compact?: boolean;
  className?: string;
  details?: ReactNode;
}

export const OperationalStatePanel = ({
  state,
  eyebrow,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  className,
  details
}: OperationalStatePanelProps) => {
  const Icon = stateIcons[state];

  return (
    <Card
      className={cn(
        "border-dashed shadow-soft",
        compact ? "rounded-2xl p-4" : "rounded-3xl p-6",
        toneClasses[state],
        className
      )}
    >
      <div className={cn("flex flex-col gap-4", compact ? "md:flex-row" : "lg:flex-row")}>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-surface-elevated/85 p-3 shadow-soft">
            {state === "loading" ? (
              <Spinner className="h-5 w-5" />
            ) : (
              <Icon className="h-5 w-5" />
            )}
          </div>
          <div className="space-y-2">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {eyebrow}
              </p>
            ) : null}
            <h3 className={cn("font-display text-foreground", compact ? "text-xl" : "text-2xl")}>
              {title}
            </h3>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              {description}
            </p>
            {details ? <div className="text-sm text-muted-foreground">{details}</div> : null}
          </div>
        </div>
        {action || secondaryAction ? (
          <div className="flex flex-wrap items-center gap-3 lg:ml-auto lg:self-start">
            {secondaryAction}
            {action}
          </div>
        ) : null}
      </div>
    </Card>
  );
};

export const InlineOperationalNotice = ({
  title,
  description,
  action,
  tone = "info"
}: {
  title: string;
  description: string;
  action?: ReactNode;
  tone?: "warning" | "danger" | "info";
}) => (
  <div
    className={cn(
      "flex flex-col gap-3 rounded-2xl border px-4 py-4 text-sm shadow-soft md:flex-row md:items-start md:justify-between",
      tone === "warning" && "border-warning/30 bg-warning/10 text-foreground",
      tone === "danger" && "border-danger/30 bg-danger/10 text-foreground",
      tone === "info" && "border-info/30 bg-info/10 text-foreground"
    )}
  >
    <div className="flex items-start gap-3">
      <div className="rounded-2xl bg-surface-elevated/85 p-2 shadow-soft">
        <TriangleAlert className="h-4 w-4" />
      </div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>
    </div>
    {action ? <div className="md:ml-auto">{action}</div> : null}
  </div>
);

export const RetryButton = ({
  isPending = false,
  onClick,
  label = "Try again"
}: {
  isPending?: boolean;
  onClick: () => void;
  label?: string;
}) => (
  <Button disabled={isPending} onClick={onClick} variant="secondary">
    {isPending ? <Spinner /> : <RefreshCcw className="h-4 w-4" />}
    {isPending ? "Retrying..." : label}
  </Button>
);
