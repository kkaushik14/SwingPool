import { ArrowRight } from "lucide-react";

import { ButtonLink, Card } from "@/components";
import { FaqAccordion, PublicPageShell, Reveal, publicFaqItems } from "@/features/marketing";
import { routePaths } from "@/routes/paths";

export const FaqPage = () => {
  return (
    <PublicPageShell
      eyebrow="FAQ"
      title="Clear answers for the questions people ask before they commit."
      description="The platform works best when members know the rules up front, so the public experience explains activation, scoring, charity impact, and winner handling plainly."
      actions={
        <>
          <ButtonLink to={routePaths.signup}>
            Join the Draw
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink to={routePaths.contact} variant="secondary">
            Contact support
          </ButtonLink>
        </>
      }
      aside={
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            Most asked
          </p>
          {publicFaqItems.slice(0, 3).map((item) => (
            <Card key={item.question} className="bg-surface-elevated/90 p-4">
              <p className="font-semibold text-foreground">{item.question}</p>
            </Card>
          ))}
        </div>
      }
    >
      <Reveal>
        <FaqAccordion items={[...publicFaqItems]} />
      </Reveal>
    </PublicPageShell>
  );
};
