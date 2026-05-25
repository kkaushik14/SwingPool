import type { LabelHTMLAttributes } from "react";

import { cn } from "@/lib";

export const Label = ({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) => {
  return (
    <label
      className={cn("mb-2 inline-flex text-sm font-semibold text-foreground", className)}
      {...props}
    />
  );
};
