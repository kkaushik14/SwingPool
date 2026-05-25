import { ArrowRight, CircleGauge, HeartHandshake, ShieldCheck, Trophy, WalletCards } from "lucide-react";

import { Badge, ButtonLink, Card, SectionHeading } from "@/components";
import {
  PublicPageShell,
  Reveal,
  howItWorksSteps,
  prizeExcitementPoints,
  publicTrustStats
} from "@/features/marketing";
import { routePaths } from "@/routes/paths";

const detailCards = [
  {
    icon: ShieldCheck,
    title: "Verification-first onboarding",
    description:
      "Signup begins the journey, but activation only happens after email verification and profile review are complete."
  },
  {
    icon: WalletCards,
    title: "Payment that waits for trust",
    description:
      "The backend confirms payment state and activation. Client-side success screens are never the source of truth."
  },
  {
    icon: CircleGauge,
    title: "Score-led contest numbers",
    description:
      "Your five latest qualifying scores become your contest numbers, as long as they remain distinct and valid."
  },
  {
    icon: HeartHandshake,
    title: "Impact with every cycle",
    description:
      "Each paid cycle contributes to charity allocation while still supporting the prize pool and platform operations."
  }
] as const;

export const HowItWorksPage = () => {
  return (
    <PublicPageShell
      eyebrow="How it works"
      title="A premium member loop designed to feel simple and stay trustworthy."
      description="The platform is intentionally easy to understand: verify, subscribe, keep your scores current, and let the backend manage draw readiness and payment truth."
      actions={
        <>
          <ButtonLink to={routePaths.signup}>
            Join the Draw
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink to={routePaths.pricing} variant="secondary">
            See pricing
          </ButtonLink>
        </>
      }
      aside={
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            The member rhythm
          </p>
          {howItWorksSteps.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-border/70 bg-surface-elevated/90 px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-soft font-display text-xl text-primary">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{step.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      }
    >
      <Reveal>
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Detailed flow"
            title="What happens at each stage"
            description="Each stage keeps business rules visible so members do not have to guess what qualifies them, what activates their subscription, or how the draw works."
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {detailCards.map((card) => {
              const Icon = card.icon;

              return (
                <Card key={card.title}>
                  <div className="rounded-2xl bg-primary-soft p-3 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-display text-2xl text-foreground">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {card.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {publicTrustStats.map((stat) => (
            <Card key={stat.label} className="bg-surface-elevated/90">
              <p className="font-display text-4xl text-foreground">{stat.value}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                {stat.label}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{stat.description}</p>
            </Card>
          ))}
        </section>
      </Reveal>

      <Reveal>
        <section className="rounded-[2rem] border border-border/70 bg-charcoal px-5 py-8 text-primary-foreground shadow-card sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <Badge tone="accent">Draw mechanics</Badge>
              <h2 className="mt-4 font-display text-4xl leading-tight">
                The draw is easy to explain because the backend rules stay strict.
              </h2>
              <p className="mt-4 text-base leading-8 text-primary-foreground/78">
                Eligibility is checked around the monthly cutoff and again on draw day.
                If a member is lapsed when it matters, they are not entered, even if they
                were previously active.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {prizeExcitementPoints.map((point) => (
                <div key={point} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-accent/20 p-2 text-accent">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <p className="text-sm leading-7 text-primary-foreground/85">{point}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>
    </PublicPageShell>
  );
};
