import { ArrowRight } from "lucide-react";

import { Alert, ButtonLink, Card, SectionHeading } from "@/components";
import {
  getPublicCatalogNotice,
  PublicPageShell,
  PublicPlanCard,
  Reveal,
  pricingHighlights,
  usePublicPlansCatalog
} from "@/features/marketing";
import { routePaths } from "@/routes/paths";

export const PricingPage = () => {
  const plansQuery = usePublicPlansCatalog();
  const plans = plansQuery.data.items;
  const plansNotice = getPublicCatalogNotice(plansQuery.data);

  return (
    <PublicPageShell
      eyebrow="Pricing"
      title="Choose the plan length that suits your life, not your odds."
      description="Monthly, quarterly, and yearly plans all receive equal draw treatment. Pick the billing rhythm you prefer, then let verification and payment truth decide activation."
      actions={
        <>
          <ButtonLink to={routePaths.signup}>
            Join the Draw
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink to={routePaths.howItWorks} variant="secondary">
            How it works
          </ButtonLink>
        </>
      }
      aside={
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            Pricing principles
          </p>
          {pricingHighlights.map((item) => (
            <div key={item} className="rounded-2xl border border-border/70 bg-surface-elevated/90 px-4 py-4 text-sm text-muted-foreground">
              {item}
            </div>
          ))}
        </div>
      }
    >
      <Reveal>
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Current plans"
            title="Live plan values from the backend"
            description="These cards are already aligned to the backend plan surface and gracefully fall back when local data is unavailable."
          />
          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <PublicPlanCard key={plan.id} plan={plan} highlighted={index === 1} />
            ))}
          </div>
          {plansNotice ? (
            <Alert tone="info" title="Preview pricing">
              {plansNotice}
            </Alert>
          ) : null}
        </section>
      </Reveal>

      <Reveal>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pricingHighlights.map((item) => (
            <Card key={item} className="bg-surface-elevated/90">
              <p className="text-sm leading-7 text-muted-foreground">{item}</p>
            </Card>
          ))}
        </section>
      </Reveal>
    </PublicPageShell>
  );
};
