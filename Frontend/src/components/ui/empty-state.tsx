import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib";

import { Button } from "./button";
import { Card } from "./card";

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: ReactNode;
  visual?: ReactNode;
  align?: "start" | "center";
}

export const EmptyState = ({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
  action,
  visual,
  align = "start",
  className,
  ...props
}: EmptyStateProps) => {
  const isCentered = align === "center";

  return (
    <Card
      className={cn(
        "flex flex-col gap-5 border-dashed bg-surface-elevated/95",
        isCentered ? "items-center text-center" : "items-start text-left",
        className
      )}
      {...props}
    >
      {eyebrow ? (
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
          {eyebrow}
        </span>
      ) : null}
      {visual ? (
        <div className="rounded-3xl border border-border/70 bg-surface-soft/80 p-4 shadow-soft">
          {visual}
        </div>
      ) : null}
      <div className="space-y-2">
        <h3 className="font-display text-2xl leading-tight text-foreground">{title}</h3>
        <p className="max-w-xl text-sm leading-7 text-muted-foreground">{description}</p>
      </div>
      {action ? action : null}
      {!action && actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
    </Card>
  );
};
