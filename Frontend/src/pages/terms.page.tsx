import { ArrowRight } from "lucide-react";

import { ButtonLink, Card } from "@/components";
import { PublicPageShell, Reveal, termsSections } from "@/features/marketing";
import { routePaths } from "@/routes/paths";

export const TermsPage = () => {
  return (
    <PublicPageShell
      eyebrow="Terms"
      title="Platform use depends on clean account conduct and backend-confirmed outcomes."
      description="This public summary gives product-facing context for the major operating principles. Replace or supplement it with final legal copy before launch."
      actions={
        <>
          <ButtonLink to={routePaths.signup}>
            Join the Draw
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink to={routePaths.privacy} variant="secondary">
            Privacy
          </ButtonLink>
        </>
      }
      aside={
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            Important note
          </p>
          <div className="rounded-2xl border border-border/70 bg-surface-elevated/90 px-4 py-4 text-sm text-muted-foreground">
            This is a product-ready summary page, not final legal advice.
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {termsSections.map((section) => (
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
