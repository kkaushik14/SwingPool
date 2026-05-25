import { ArrowRight } from "lucide-react";

import { ButtonLink, Card } from "@/components";
import { PublicPageShell, Reveal, privacySections } from "@/features/marketing";
import { routePaths } from "@/routes/paths";

export const PrivacyPage = () => {
  return (
    <PublicPageShell
      eyebrow="Privacy"
      title="Operational trust depends on handling member data with care and clear purpose."
      description="This page gives a public summary of the data categories and reasons the platform needs them. Replace or supplement it with final launch-ready legal privacy copy."
      actions={
        <>
          <ButtonLink to={routePaths.signup}>
            Join the Draw
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink to={routePaths.terms} variant="secondary">
            Terms
          </ButtonLink>
        </>
      }
      aside={
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            Privacy stance
          </p>
          <div className="rounded-2xl border border-border/70 bg-surface-elevated/90 px-4 py-4 text-sm text-muted-foreground">
            Data handling exists to support security, accounting integrity, membership state, and safe operations across the platform lifecycle.
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {privacySections.map((section) => (
          <Reveal key={section.title}>
            <Card className="bg-surface-elevated/90">
              <h2 className="font-display text-3xl text-foreground">{section.title}</h2>
              <p className="mt-4 text-sm leading-8 text-muted-foreground">{section.content}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </PublicPageShell>
  );
};
