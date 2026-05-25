import { ArrowRight, BadgeCheck, FileCheck2, Landmark, Trophy } from "lucide-react";

import { Badge, ButtonLink, Card, SectionHeading } from "@/components";
import {
  PublicPageShell,
  Reveal,
  prizeExcitementPoints,
  winnerJourneyPreview
} from "@/features/marketing";
import { routePaths } from "@/routes/paths";

const payoutStates = [
  "pending_verification",
  "approved",
  "payout_pending",
  "paid"
] as const;

export const WinnersPage = () => {
  return (
    <PublicPageShell
      eyebrow="Winners"
      title="Winning is a workflow, not just a celebration screen."
      description="The platform keeps winner handling traceable from result publication to proof review and final payout, with clear states along the way."
      actions={
        <>
          <ButtonLink to={routePaths.signup}>
            Join the Draw
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink to={routePaths.howItWorks} variant="secondary">
            See the member flow
          </ButtonLink>
        </>
      }
      aside={
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            Winner lifecycle
          </p>
          {winnerJourneyPreview.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border/70 bg-surface-elevated/90 px-4 py-4">
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      }
    >
      <Reveal>
        <section className="space-y-6">
          <SectionHeading
            eyebrow="What happens after results"
            title="Proof, review, and payout stay visible"
            description="Once results are published, the backend keeps them immutable. Winner handling then follows a separate proof and payout flow."
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <Card className="bg-surface-elevated/90">
              <div className="rounded-2xl bg-primary-soft p-3 text-primary w-fit">
                <Trophy className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-2xl text-foreground">Results are published</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Draw publication creates the fixed record that members and admins refer to from that point onward.
              </p>
            </Card>
            <Card className="bg-surface-elevated/90">
              <div className="rounded-2xl bg-accent-soft p-3 text-accent-foreground w-fit">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-2xl text-foreground">Winner proof is reviewed</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Winners submit proof within the defined deadline, and the review path can approve, reject, or allow resubmission.
              </p>
            </Card>
            <Card className="bg-surface-elevated/90">
              <div className="rounded-2xl bg-coral-soft p-3 text-coral w-fit">
                <Landmark className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-2xl text-foreground">Payout completes</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                After approval, payout moves through payout-pending and finally paid once the backend confirms completion.
              </p>
            </Card>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Payout states"
            title="The public-facing winner journey is transparent by design"
            description="These are the major states members move through after a successful match."
          />
          <div className="flex flex-wrap gap-3">
            {payoutStates.map((state) => (
              <Badge key={state} tone={state === "paid" ? "success" : state === "approved" ? "accent" : "info"} className="px-4 py-2">
                {state}
              </Badge>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="rounded-[2rem] border border-border/70 bg-charcoal px-5 py-8 text-primary-foreground shadow-card sm:px-8">
          <div className="grid gap-4 md:grid-cols-2">
            {prizeExcitementPoints.map((point) => (
              <div key={point} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-accent/20 p-2 text-accent">
                    <BadgeCheck className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-7 text-primary-foreground/85">{point}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>
    </PublicPageShell>
  );
};
