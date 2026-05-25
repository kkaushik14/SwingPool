import { ArrowRight, Mail, MessageSquareText } from "lucide-react";

import { ButtonLink, Card, SectionHeading } from "@/components";
import { PublicPageShell, Reveal, contactChannels } from "@/features/marketing";
import { routePaths } from "@/routes/paths";

export const ContactPage = () => {
  return (
    <PublicPageShell
      eyebrow="Contact"
      title="Reach the right team without guessing where your question belongs."
      description="Whether you need support with billing, impact reporting, or membership flow, this page steers you to the clearest lane."
      actions={
        <>
          <ButtonLink to={routePaths.signup}>
            Join the Draw
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink to={routePaths.faq} variant="secondary">
            Read the FAQ
          </ButtonLink>
        </>
      }
      aside={
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            Support posture
          </p>
          <div className="rounded-2xl border border-border/70 bg-surface-elevated/90 px-4 py-4">
            <p className="text-sm text-muted-foreground">
              For account-specific issues, signing in first helps the team understand your membership state and latest notifications more quickly.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-surface-elevated/90 px-4 py-4">
            <p className="text-sm text-muted-foreground">
              Replace these placeholder inboxes with production support addresses before launch.
            </p>
          </div>
        </div>
      }
    >
      <Reveal>
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Contact lanes"
            title="Choose the inbox that matches the topic"
            description="These channels keep conversations cleaner and help route operational issues to the right people."
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {contactChannels.map((channel) => (
              <Card key={channel.title} className="bg-surface-elevated/90">
                <div className="rounded-2xl bg-primary-soft p-3 text-primary w-fit">
                  <Mail className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-2xl text-foreground">{channel.title}</h3>
                <a
                  href={`mailto:${channel.value}`}
                  className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
                >
                  {channel.value}
                </a>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {channel.description}
                </p>
              </Card>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="bg-mesh-warm">
            <div className="rounded-2xl bg-coral-soft p-3 text-coral w-fit">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <h2 className="mt-5 font-display text-3xl text-foreground">What to include when you reach out</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Share the route you were on, the account email you used, and any visible request id if the issue came from a backend-connected action.
            </p>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              "Your account email or display name",
              "The page or flow where the issue happened",
              "Any error text or request id shown in the interface",
              "Whether the issue is about billing, charity, score, draw, or payout state"
            ].map((item) => (
              <Card key={item} className="bg-surface-elevated/90">
                <p className="text-sm leading-7 text-muted-foreground">{item}</p>
              </Card>
            ))}
          </div>
        </section>
      </Reveal>
    </PublicPageShell>
  );
};
