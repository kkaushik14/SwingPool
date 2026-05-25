import type { ReactNode } from "react";

import { Card } from "@/components";

import { Reveal } from "./reveal";

interface PublicPageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}

export const PublicPageShell = ({
  eyebrow,
  title,
  description,
  actions,
  aside,
  children
}: PublicPageShellProps) => {
  return (
    <div className="space-y-14 sm:space-y-16">
      <Reveal>
        <section className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
              {eyebrow}
            </p>
            <h1 className="max-w-4xl font-display text-5xl leading-[1.02] text-foreground sm:text-6xl">
              {title}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">{description}</p>
            {actions ? <div className="flex flex-wrap gap-3 pt-1">{actions}</div> : null}
          </div>
          {aside ? (
            <Card className="overflow-hidden bg-mesh-warm p-6 sm:p-7">{aside}</Card>
          ) : null}
        </section>
      </Reveal>

      {children}
    </div>
  );
};
