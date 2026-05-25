import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, HeartHandshake, ShieldCheck, WalletCards } from "lucide-react";
import { useLocation } from "react-router-dom";

import {
  Alert,
  Badge,
  ButtonLink,
  Card,
  OperationalStatePanel,
  RetryButton,
  SectionHeading,
  Stepper
} from "@/components";
import { queryKeys } from "@/constants";
import { useAuth } from "@/features/auth";
import { getActiveOrLatestSubscription } from "@/features/dashboard";
import { buildOnboardingState } from "@/features/onboarding";
import { routePaths } from "@/routes/paths";
import { charitiesService, subscriptionsService, usersService } from "@/services";
import { formatDate, toStatusLabel, toStatusTone } from "@/utils";

const onboardingStepCopy = {
  account: {
    eyebrow: "Account",
    title: "Start with secure access and verified email ownership",
    description:
      "Your account exists, but activation still waits on verified identity, profile completion, charity choice, and confirmed payment."
  },
  profile: {
    eyebrow: "Profile",
    title: "Complete the details needed for verification review",
    description:
      "The backend uses full profile completion as a gate before subscription eligibility can turn on."
  },
  verify: {
    eyebrow: "Verify",
    title: "Email and profile verification both need backend confirmation",
    description:
      "Email verification and profile-review approval are separate, and both need to land before activation can finish."
  },
  charity: {
    eyebrow: "Charity & Payment",
    title: "Choose your charity before the first successful payment activates access",
    description:
      "Future allocations should be intentional up front, and the backend still decides when payment finally succeeds."
  },
  payment: {
    eyebrow: "Charity & Payment",
    title: "Finish payment setup and wait for backend-confirmed success",
    description:
      "Client-side redirects are not treated as final success. We wait for the backend-backed payment state."
  },
  success: {
    eyebrow: "Ready",
    title: "You’ve completed the onboarding gates required for activation",
    description:
      "Email verification, profile verification, charity setup, and payment-backed activation are all in place."
  }
} as const;

export const OnboardingPage = () => {
  const location = useLocation();
  const { user } = useAuth();
  const profileStatusQuery = useQuery({
    queryKey: queryKeys.profileStatus,
    queryFn: async () => (await usersService.getProfileStatus()).data,
    meta: {
      suppressGlobalErrorToast: true
    }
  });
  const charitySelectionQuery = useQuery({
    queryKey: queryKeys.myCharitySelection,
    queryFn: async () => (await charitiesService.getMySelection()).data,
    meta: {
      suppressGlobalErrorToast: true
    }
  });
  const subscriptionsQuery = useQuery({
    queryKey: queryKeys.mySubscriptions,
    queryFn: async () => (await subscriptionsService.listMine()).data,
    meta: {
      suppressGlobalErrorToast: true
    }
  });

  const criticalQueries = [profileStatusQuery, charitySelectionQuery, subscriptionsQuery];
  const hasData = criticalQueries.some((query) => query.data !== undefined);
  const isInitialLoading = criticalQueries.some((query) => query.isPending) && !hasData;
  const hasBlockingError = criticalQueries.some((query) => query.isError) && !hasData;
  const retryOnboardingQueries = async () => {
    await Promise.all(criticalQueries.map((query) => query.refetch()));
  };

  const onboardingState = buildOnboardingState({
    user,
    profileStatus: profileStatusQuery.data,
    charitySelection: charitySelectionQuery.data,
    subscription: getActiveOrLatestSubscription(subscriptionsQuery.data || [])
  });

  const stageKey = location.pathname.endsWith("/profile")
    ? "profile"
    : location.pathname.endsWith("/verify")
      ? "verify"
      : location.pathname.endsWith("/charity-payment")
        ? onboardingState.currentStepKey === "payment"
          ? "payment"
          : "charity"
        : location.pathname.endsWith("/success")
          ? "success"
          : "account";

  const copy = onboardingStepCopy[stageKey];
  const currentSubscription = getActiveOrLatestSubscription(subscriptionsQuery.data || []);

  if (isInitialLoading) {
    return (
      <OperationalStatePanel
        state="loading"
        eyebrow="Onboarding"
        title="Loading your onboarding state"
        description="We’re checking profile, charity, and subscription readiness against the current backend records."
      />
    );
  }

  if (hasBlockingError) {
    return (
      <OperationalStatePanel
        state="error"
        eyebrow="Onboarding"
        title="Onboarding state could not be loaded"
        description="We could not confirm your current readiness from the backend."
        action={<RetryButton onClick={() => void retryOnboardingQueries()} />}
      />
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        action={
          !onboardingState.ready ? (
            <ButtonLink to={onboardingState.nextPath} variant="secondary">
              Continue next step
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          ) : (
            <ButtonLink to={routePaths.app} variant="secondary">
              Return to dashboard
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          )
        }
      />

      <Card className="bg-surface-elevated/95">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={onboardingState.ready ? "success" : "warning"}>
              {onboardingState.ready ? "Ready for active use" : "Setup still in progress"}
            </Badge>
            <Badge tone="muted">
              Current stage: {toStatusLabel(onboardingState.currentStepKey)}
            </Badge>
          </div>
          <Stepper
            steps={onboardingState.steps.map((step) => ({
              title: step.title,
              description: step.description,
              state: step.state
            }))}
          />
        </div>
      </Card>

      {!onboardingState.ready ? (
        <Alert tone="warning" title="Activation stays blocked until all gates are complete">
          {onboardingState.blockers.join(" ")}
        </Alert>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-4 bg-surface-elevated/95">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary-soft p-3 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                Verification state
              </p>
              <h2 className="font-display text-2xl text-foreground">
                {profileStatusQuery.data?.eligibleForSubscription
                  ? "Verification aligned"
                  : "Verification still pending"}
              </h2>
            </div>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between gap-3">
              <span>Email</span>
              <Badge tone={profileStatusQuery.data?.emailVerified ? "success" : "warning"}>
                {profileStatusQuery.data?.emailVerified ? "Verified" : "Pending"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Profile completion</span>
              <Badge tone={profileStatusQuery.data?.profileCompleted ? "success" : "warning"}>
                {profileStatusQuery.data?.profileCompleted ? "Complete" : "Incomplete"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Review status</span>
              <Badge tone={toStatusTone(profileStatusQuery.data?.profileVerificationStatus)}>
                {toStatusLabel(profileStatusQuery.data?.profileVerificationStatus)}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink to={routePaths.profile} variant="secondary">
              Open profile
            </ButtonLink>
            <ButtonLink
              to={`${routePaths.verifyEmail}?email=${encodeURIComponent(user?.email || "")}`}
              variant="secondary"
            >
              Email verification tools
            </ButtonLink>
          </div>
        </Card>

        <Card className="space-y-4 bg-surface-elevated/95">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-coral-soft p-3 text-coral">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-coral">
                Charity & billing
              </p>
              <h2 className="font-display text-2xl text-foreground">
                {currentSubscription?.status ? "Payment state is tracked" : "Payment not started"}
              </h2>
            </div>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between gap-3">
              <span>Charity</span>
              <Badge tone={charitySelectionQuery.data?.charityId ? "success" : "warning"}>
                {charitySelectionQuery.data?.charityId ? "Selected" : "Missing"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Subscription</span>
              <Badge tone={toStatusTone(currentSubscription?.status)}>
                {toStatusLabel(currentSubscription?.status || "not_started")}
              </Badge>
            </div>
            <div className="rounded-2xl bg-surface-soft/80 p-4">
              <p className="font-medium text-foreground">
                {currentSubscription?.status
                  ? `Latest billing state updated ${formatDate(
                      currentSubscription.updatedAt || currentSubscription.createdAt
                    )}.`
                  : "Once checkout begins, billing state will appear here and stay tied to backend-confirmed payment records."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink to={routePaths.charities} variant="secondary">
              Choose charity
            </ButtonLink>
            <ButtonLink to={routePaths.subscriptions} variant="secondary">
              Open billing
              <WalletCards className="h-4 w-4" />
            </ButtonLink>
          </div>
        </Card>
      </div>

      {onboardingState.ready ? (
        <Card className="bg-mesh-warm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                Final state
              </p>
              <h2 className="font-display text-3xl text-foreground">
                Activation requirements are complete
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                You can now use the main member dashboard, keep qualifying scores current, and
                track draw readiness from the account area.
              </p>
            </div>
            <ButtonLink to={routePaths.app} variant="accent">
              Go to overview
              <CheckCircle2 className="h-4 w-4" />
            </ButtonLink>
          </div>
        </Card>
      ) : null}
    </div>
  );
};
