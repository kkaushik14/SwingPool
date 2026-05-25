import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib";

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
    icon?: ReactNode;
  }>;
}

export const Tabs = ({ className, value, onValueChange, options, ...props }: TabsProps) => {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap gap-2 rounded-pill border border-border bg-surface-soft p-2",
        className
      )}
      {...props}
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-surface-elevated text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onValueChange(option.value)}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export const TabPanel = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-5", className)} {...props} />
);

export const TabTrigger = (props: ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} />;
