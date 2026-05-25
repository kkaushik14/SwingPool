import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib";

const badgeVariants = cva(
  "inline-flex items-center rounded-pill px-3 py-1 text-xs font-semibold tracking-wide",
  {
    variants: {
      tone: {
        muted: "bg-muted text-muted-foreground",
        success: "bg-success/15 text-success",
        warning: "bg-warning/15 text-warning",
        danger: "bg-danger/15 text-danger",
        info: "bg-info/15 text-info",
        accent: "bg-accent/20 text-accent-foreground",
        coral: "bg-coral/20 text-coral"
      }
    },
    defaultVariants: {
      tone: "muted"
    }
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, tone, ...props }: BadgeProps) => {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
};
