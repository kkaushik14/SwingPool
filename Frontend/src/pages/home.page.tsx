import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeIndianRupee,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Trophy
} from "lucide-react";
import { useMemo } from "react";

import { Alert, Badge, ButtonLink, Card, SectionHeading } from "@/components";
import { enrichCharityCatalog } from "@/features/charities";
import {
  FaqAccordion,
  PublicPlanCard,
  Reveal,
  getPublicCatalogNotice,
  howItWorksSteps,
  prizeExcitementPoints,
  publicFaqItems,
  publicTrustStats,
  testimonials,
  usePublicCharitiesCatalog,
  usePublicPlansCatalog,
  winnerJourneyPreview
} from "@/features/marketing";
import { routePaths } from "@/routes/paths";

export const HomePage = () => {
  const plansQuery = usePublicPlansCatalog();
  const charitiesQuery = usePublicCharitiesCatalog();

  const plans = plansQuery.data.items;
  const charities = useMemo(
    () => enrichCharityCatalog(charitiesQuery.data.items || []),
    [charitiesQuery.data]
  );
  const featuredCharity = charities[0];
  const plansNotice = getPublicCatalogNotice(plansQuery.data);
  const charitiesNotice = getPublicCatalogNotice(charitiesQuery.data);

  return (
    <div className="space-y-14 pb-8 sm:space-y-18">
      <Reveal>
        <section className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div className="space-y-6">
            <Badge tone="accent" className="px-4 py-2 text-[11px] tracking-[0.26em]">
              Verified monthly rewards + charity impact
            </Badge>
            <div className="space-y-5">
              <h1 className="max-w-5xl font-display text-5xl leading-[1.04] text-foreground sm:text-6xl lg:text-7xl">
                Turn your latest five qualifying scores into one monthly shot at the draw.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Join, verify your profile, choose a charity, keep your latest five
                qualifying scores current, and let the platform handle the draw entry
                automatically whenever you stay eligible.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ButtonLink to={routePaths.signup} size="lg" className="min-w-[180px]">
                Join the Draw
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink to={routePaths.howItWorks} size="lg" variant="secondary">
                How it works
              </ButtonLink>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-surface-elevated/90 p-4 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                  Reward path
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your five qualifying scores become your contest numbers.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-surface-elevated/90 p-4 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                  Impact path
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Charity allocation is built directly into the billing model.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-surface-elevated/90 p-4 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                  Trust path
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Payment, activation, and winner state follow backend-confirmed rules.
                </p>
              </div>
            </div>
          </div>

          <motion.div
            className="relative min-h-[520px] overflow-hidden rounded-[2rem] border border-border/70 bg-mesh-warm p-5 shadow-card sm:p-6"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="absolute inset-x-10 top-10 h-28 rounded-full bg-accent/10 blur-3xl" />
            <div className="absolute bottom-12 right-10 h-32 w-32 rounded-full bg-primary/15 blur-3xl" />

            <motion.div
              className="relative z-10 rounded-[1.75rem] border border-primary/15 bg-surface-elevated/90 p-5 shadow-soft backdrop-blur"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                    Monthly rhythm
                  </p>
                  <h2 className="mt-2 font-display text-3xl text-foreground">
                    One calm system, four clear moves.
                  </h2>
                </div>
                <div className="rounded-2xl bg-primary-soft p-3 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {howItWorksSteps.slice(0, 3).map((step, index) => (
                  <div
                    key={step.title}
                    className="flex items-start gap-3 rounded-2xl border border-border/70 bg-surface px-4 py-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent-soft font-display text-lg text-accent-foreground">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{step.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="absolute bottom-5 left-5 z-20 max-w-[230px] rounded-[1.5rem] border border-border/70 bg-charcoal/90 p-5 text-primary-foreground shadow-card"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                Jackpot energy
              </p>
              <p className="mt-3 font-display text-4xl">Rollover</p>
              <p className="mt-2 text-sm text-primary-foreground/80">
                Five-match jackpot rolls forward without a cap if it stays unclaimed.
              </p>
            </motion.div>

            <motion.div
              className="absolute right-5 top-[55%] z-20 max-w-[220px] rounded-[1.5rem] border border-border/70 bg-surface-elevated/92 p-5 shadow-soft"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-coral">
                Impact pulse
              </p>
              <p className="mt-3 font-semibold text-foreground">
                Charity allocation is baked into the flow.
              </p>
              <div className="mt-4 space-y-2">
                <div className="h-2 rounded-full bg-surface-soft">
                  <div className="h-2 w-[35%] rounded-full bg-accent" />
                </div>
                <div className="h-2 rounded-full bg-surface-soft">
                  <div className="h-2 w-[10%] rounded-full bg-coral" />
                </div>
                <div className="h-2 rounded-full bg-surface-soft">
                  <div className="h-2 w-[48%] rounded-full bg-primary" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>
      </Reveal>

      <Reveal>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {publicTrustStats.map((stat) => (
            <Card key={stat.label} className="bg-surface-elevated/90">
              <p className="font-display text-4xl text-foreground">{stat.value}</p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.22em] text-accent">
                {stat.label}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{stat.description}</p>
            </Card>
          ))}
        </section>
      </Reveal>

      <Reveal>
        <section id="how-it-works" className="space-y-6 scroll-mt-24">
          <SectionHeading
            eyebrow="How it works"
            title="A simple loop of verification, contribution, and draw readiness"
            description="The experience stays emotionally warm, but the rules stay precise so members always understand what qualifies them and what happens next."
            action={
              <ButtonLink to={routePaths.howItWorks} variant="secondary">
                See the full flow
              </ButtonLink>
            }
          />

          <div className="grid gap-5 lg:grid-cols-4">
            {howItWorksSteps.map((step, index) => (
              <Card key={step.title} className="relative overflow-hidden bg-surface-elevated/90">
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft font-display text-2xl text-primary">
                  {index + 1}
                </div>
                <h3 className="mt-5 font-display text-2xl text-foreground">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {step.description}
                </p>
              </Card>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section id="pricing" className="space-y-6 scroll-mt-24">
          <SectionHeading
            eyebrow="Pricing preview"
            title="Choose the rhythm that keeps you in the draw"
            description="Every paid plan is treated equally for monthly draw entry. The difference is simply how you want billing to feel over time."
            action={
              <ButtonLink to={routePaths.pricing} variant="secondary">
                View pricing details
              </ButtonLink>
            }
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
        <section id="charity" className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] scroll-mt-24">
          <Card className="overflow-hidden bg-mesh-warm">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-coral">
              Featured charity spotlight
            </p>
            <h2 className="mt-4 font-display text-4xl text-foreground">
              {featuredCharity?.name || "Cause spotlight"}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
              {featuredCharity?.profile.longDescription ||
                featuredCharity?.mission ||
                "Members can direct future payments toward causes they care about, while the platform preserves historical allocation integrity."}
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-surface-elevated/90 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                  Built-in impact
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Mandatory charity allocation is embedded directly into the current business model.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-surface-elevated/90 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                  Future-only changes
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Members can switch charities for future payments while historical ledgers stay untouched.
                </p>
              </div>
            </div>
            {featuredCharity?.profile.highlightStats?.length ? (
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {featuredCharity.profile.highlightStats.slice(0, 3).map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-border/70 bg-surface-elevated/90 p-5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-coral">
                      {item.label}
                    </p>
                    <p className="mt-3 font-display text-2xl text-foreground">{item.value}</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>

          <Card className="bg-surface-elevated/92">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent">
              Every subscription creates three linked outcomes
            </p>
            <h3 className="mt-4 font-display text-3xl text-foreground">
              Members fund impact first, anticipation second, and operational trust throughout.
            </h3>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              The prize story matters, but the product identity is anchored in transparent giving.
              That’s why the charity effect is explained with the same clarity as activation and draw rules.
            </p>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-border/70 bg-surface-soft px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-accent-soft p-3 text-accent-foreground">
                    <BadgeIndianRupee className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Prize pool funding</p>
                    <p className="text-sm text-muted-foreground">
                      35% of the post-fee subscription base currently feeds the prize pool.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-surface-soft px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-coral-soft p-3 text-coral">
                    <HeartHandshake className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Charity allocation</p>
                    <p className="text-sm text-muted-foreground">
                      Mandatory charity share plus any optional donation add-on create visible impact.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-surface-soft px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary-soft p-3 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Operational trust</p>
                    <p className="text-sm text-muted-foreground">
                      Payment confirmation, ledgers, and future charity changes all stay traceable.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <ButtonLink to={routePaths.publicCharities} className="mt-6" variant="secondary">
              Explore charities
            </ButtonLink>
            {charitiesNotice ? (
              <div className="mt-6">
                <Alert tone="info" title="Preview charity catalog">
                  {charitiesNotice}
                </Alert>
              </div>
            ) : null}
          </Card>
        </section>
      </Reveal>

      <Reveal>
        <section className="rounded-[2rem] border border-border/70 bg-charcoal px-5 py-8 text-primary-foreground shadow-card sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent">
                Prize excitement
              </p>
              <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight sm:text-5xl">
                The draw stays simple, but the tension builds beautifully.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-primary-foreground/78">
                Your five contest numbers come directly from your qualifying scores. If the
                five-match jackpot stays unclaimed, the next draw carries the rollover
                forward without a cap.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {prizeExcitementPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-2xl bg-accent/20 p-2 text-accent">
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

      <Reveal>
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Member voice"
            title="People stay because the platform feels clear, premium, and fair"
            description="These early-member style quotes reflect the design tone we are aiming for: emotionally warm without feeling vague or gimmicky."
          />
          <div className="grid gap-5 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card
                key={testimonial.name}
                className={index === 1 ? "bg-mesh-warm" : "bg-surface-elevated/90"}
              >
                <p className="font-display text-3xl leading-tight text-foreground">“</p>
                <p className="mt-3 text-base leading-8 text-muted-foreground">
                  {testimonial.quote}
                </p>
                <div className="mt-5 border-t border-border/70 pt-4">
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Winners preview"
            title="What the winner journey looks like after a result is published"
            description="Winning is not just a confetti moment. It is a managed proof and payout workflow with states that remain visible from review to completion."
            action={
              <ButtonLink to={routePaths.publicWinners} variant="secondary">
                See winner flow
              </ButtonLink>
            }
          />
          <div className="grid gap-5 lg:grid-cols-3">
            {winnerJourneyPreview.map((item, index) => (
              <Card
                key={item.title}
                className={index === 0 ? "bg-mesh-warm" : "bg-surface-elevated/90"}
              >
                <Badge tone={index === 1 ? "accent" : index === 2 ? "coral" : "info"}>
                  {index === 0
                    ? "Proof"
                    : index === 1
                      ? "Review"
                      : "Rollover"}
                </Badge>
                <h3 className="mt-4 font-display text-2xl text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {item.description}
                </p>
              </Card>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="space-y-4">
            <SectionHeading
              eyebrow="FAQ preview"
              title="The important answers are already built into the product rules"
              description="We keep the public explanation simple, but we never hide the backend-driven eligibility and payment rules behind vague marketing language."
            />
            <ButtonLink to={routePaths.faq} variant="secondary">
              Read the full FAQ
            </ButtonLink>
          </div>

          <FaqAccordion items={[...publicFaqItems].slice(0, 4)} />
        </section>
      </Reveal>

      <Reveal>
        <section className="rounded-[2rem] border border-border/70 bg-mesh-warm px-5 py-8 shadow-card sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent">
                Final call
              </p>
              <h2 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-foreground sm:text-5xl">
                If the mix of verified play, monthly anticipation, and real-world impact feels right, this is your moment.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
                Start with signup, complete verification, and let the platform guide you toward a clean draw-ready state.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink to={routePaths.signup} size="lg">
                Join the Draw
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink to={routePaths.login} size="lg" variant="secondary">
                I already have an account
              </ButtonLink>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
};
