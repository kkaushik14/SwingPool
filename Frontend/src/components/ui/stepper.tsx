import type { ReactNode } from "react";

import { cn } from "@/lib";

interface StepItem {
  title: string;
  description: string;
  state?: "complete" | "current" | "upcoming";
  icon?: ReactNode;
}

export const Stepper = ({ steps }: { steps: StepItem[] }) => {
  return (
    <ol className="space-y-4">
      {steps.map((step, index) => {
        const state = step.state || "upcoming";

        return (
          <li key={step.title} className="flex gap-4">
            <div
              className={cn(
                "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                state === "complete" && "border-success/40 bg-success/15 text-success",
                state === "current" && "border-accent/50 bg-accent/20 text-accent-foreground",
                state === "upcoming" && "border-border bg-surface-soft text-muted-foreground"
              )}
            >
              {step.icon || index + 1}
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">{step.title}</h4>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
};
