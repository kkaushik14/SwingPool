import * as React from "react";

import { cn } from "@/lib";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => {
    const isInvalid = invalid || props["aria-invalid"] === true;

    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-[120px] w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-soft outline-none transition duration-200 placeholder:text-muted-foreground focus:border-accent focus:ring-4 focus:ring-accent/10",
          isInvalid && "border-danger/60 focus:border-danger focus:ring-danger/10",
          className
        )}
        aria-invalid={isInvalid || undefined}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
