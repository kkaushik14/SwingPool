import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, invalid, ...props }, ref) => {
    const isInvalid = invalid || props["aria-invalid"] === true;

    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "flex h-12 w-full appearance-none rounded-lg border border-border bg-surface px-4 pr-10 text-sm text-foreground shadow-soft outline-none transition duration-200 focus:border-accent focus:ring-4 focus:ring-accent/10",
            isInvalid && "border-danger/60 focus:border-danger focus:ring-danger/10",
            className
          )}
          aria-invalid={isInvalid || undefined}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    );
  }
);

Select.displayName = "Select";
