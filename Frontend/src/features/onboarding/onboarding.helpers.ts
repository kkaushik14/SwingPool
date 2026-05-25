import { routePaths } from "@/routes/paths";
import type {
  CharitySelectionRecord,
  ProfileVerificationState,
  SubscriptionRecord,
  UserRecord
} from "@/types";

type OnboardingStepKey = "account" | "profile" | "verify" | "charity" | "payment";

export interface OnboardingStep {
  key: OnboardingStepKey;
  title: string;
  description: string;
  completed: boolean;
  state: "complete" | "current" | "upcoming";
  href: string;
}

export interface OnboardingState {
  ready: boolean;
  nextPath: string;
  currentStepKey: OnboardingStepKey | "success";
  blockers: string[];
  steps: OnboardingStep[];
}

const PAYMENT_READY_STATUSES = new Set(["active", "grace_period"]);

export const buildOnboardingState = ({
  user,
  profileStatus,
  charitySelection,
  subscription
}: {
  user?: UserRecord | null;
  profileStatus?: ProfileVerificationState | null;
  charitySelection?: CharitySelectionRecord | null;
  subscription?: SubscriptionRecord | null;
}): OnboardingState => {
  const accountComplete = Boolean(user?.id);
  const profileComplete = Boolean(profileStatus?.profileCompleted);
  const verifyComplete = Boolean(
    profileStatus?.emailVerified &&
      profileStatus?.profileVerificationStatus === "verified"
  );
  const charityComplete = Boolean(charitySelection?.charityId);
  const paymentComplete = Boolean(
    subscription?.status && PAYMENT_READY_STATUSES.has(subscription.status)
  );

  const orderedSteps: Array<{
    key: OnboardingStepKey;
    title: string;
    description: string;
    completed: boolean;
    href: string;
  }> = [
    {
      key: "account",
      title: "Account",
      description: "Secure access is created and the member session is available.",
      completed: accountComplete,
      href: routePaths.onboarding
    },
    {
      key: "profile",
      title: "Profile",
      description: "Complete your profile details so verification can progress cleanly.",
      completed: profileComplete,
      href: routePaths.onboardingProfile
    },
    {
      key: "verify",
      title: "Verify",
      description: "Email and profile verification both need backend confirmation.",
      completed: verifyComplete,
      href: routePaths.onboardingVerify
    },
    {
      key: "charity",
      title: "Charity",
      description: "Choose the charity that future payments should support.",
      completed: charityComplete,
      href: routePaths.onboardingCharityPayment
    },
    {
      key: "payment",
      title: "Payment",
      description: "Activation only happens after the backend confirms payment.",
      completed: paymentComplete,
      href: routePaths.onboardingCharityPayment
    }
  ];

  const currentStepKey =
    orderedSteps.find((step) => !step.completed)?.key || "success";
  const nextPath =
    currentStepKey === "success"
      ? routePaths.onboardingSuccess
      : orderedSteps.find((step) => step.key === currentStepKey)?.href ||
        routePaths.onboarding;

  const blockers = [
    !profileComplete ? "Complete your full profile details." : null,
    !profileStatus?.emailVerified ? "Verify your email address." : null,
    profileStatus?.profileVerificationStatus !== "verified"
      ? "Wait for or complete profile verification review."
      : null,
    !charityComplete ? "Choose a charity for future payments." : null,
    !paymentComplete ? "Finish checkout and wait for backend-confirmed payment success." : null
  ].filter((value): value is string => Boolean(value));

  let currentAssigned = false;

  return {
    ready: currentStepKey === "success",
    nextPath,
    currentStepKey,
    blockers,
    steps: orderedSteps.map((step) => {
      const state = step.completed
        ? ("complete" as const)
        : !currentAssigned
          ? ((currentAssigned = true), "current" as const)
          : ("upcoming" as const);

      return {
        ...step,
        state
      };
    })
  };
};
