import * as React from "react";

import { cn } from "@/lib";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => {
    const isInvalid = invalid || props["aria-invalid"] === true;

    return (
      <input
        ref={ref}
        className={cn(
          "flex h-12 w-full rounded-lg border border-border bg-surface px-4 text-sm text-foreground shadow-soft outline-none transition duration-200 placeholder:text-muted-foreground focus:border-accent focus:ring-4 focus:ring-accent/10",
          isInvalid && "border-danger/60 focus:border-danger focus:ring-danger/10",
          className
        )}
        aria-invalid={isInvalid || undefined}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
