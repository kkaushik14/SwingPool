import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib";

interface SectionHeadingProps extends HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const SectionHeading = ({
  className,
  eyebrow,
  title,
  description,
  action,
  ...props
}: SectionHeadingProps) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 md:flex-row md:items-end md:justify-between",
        className
      )}
      {...props}
    >
      <div className="max-w-3xl space-y-3">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">{eyebrow}</p>
        ) : null}
        <h2 className="font-display text-3xl leading-tight text-foreground sm:text-4xl">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex flex-wrap gap-3 md:justify-end">{action}</div> : null}
    </div>
  );
};
