import { Outlet } from "react-router-dom";

import { BrandMark, Stepper, ThemeToggle } from "@/components";

const authSteps = [
  {
    title: "Create secure access",
    description: "Registration and login keep the frontend aligned with JWT session flows.",
    state: "complete" as const
  },
  {
    title: "Complete profile verification",
    description: "Subscription activation depends on email, profile completion, and admin verification.",
    state: "current" as const
  },
  {
    title: "Track scores and impact",
    description: "Verified members can move into subscriptions, charities, score history, and draw readiness.",
    state: "upcoming" as const
  }
];

export const AuthLayout = () => {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[60] rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only"
      >
        Skip to content
      </a>
      <div className="relative hidden overflow-hidden bg-mesh-warm px-10 py-10 lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/75 via-primary/50 to-transparent" />
        <div className="relative flex items-center justify-between">
          <BrandMark className="[&_p:last-child]:text-primary-foreground/70 [&_p]:text-primary-foreground" />
          <ThemeToggle />
        </div>
        <div className="relative mt-auto max-w-xl space-y-8 pb-12">
          <div className="space-y-4 text-primary-foreground">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-foreground/70">Access Flow</p>
            <h1 className="font-display text-5xl leading-tight">
              Verified accounts unlock the full warmth of the platform.
            </h1>
            <p className="text-base text-primary-foreground/80">
              The frontend is designed around trust-building steps rather than sporty bravado: identity, readiness, impact, then reward participation.
            </p>
          </div>
          <Stepper steps={authSteps} />
        </div>
      </div>
      <div className="flex min-h-screen flex-col bg-background px-4 py-5 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between lg:hidden">
          <BrandMark />
          <ThemeToggle />
        </div>
        <div id="main-content" className="mx-auto flex w-full max-w-xl flex-1 items-center py-10 lg:py-16">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
