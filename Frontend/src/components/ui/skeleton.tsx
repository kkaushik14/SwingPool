import type { HTMLAttributes } from "react";

import { cn } from "@/lib";

export const Skeleton = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "animate-shimmer rounded-lg bg-[length:200%_100%] bg-gradient-to-r from-surface-soft via-surface-elevated to-surface-soft",
      className
    )}
    {...props}
  />
);
