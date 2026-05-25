import type {
  CharityDonationRecord,
  CharityRecord,
  CharitySelectionRecord,
  NotificationRecord,
  ProfileVerificationState,
  ScoreEligibilityState,
  ScoreRecord,
  SubscriptionRecord,
  WinnerRecord
} from "@/types";

import { getEligibilityReasonLabels } from "@/features/scores";
import { getCurrentSubscription } from "@/features/subscriptions";

export interface ReadinessChecklistItem {
  key: string;
  label: string;
  description: string;
  completed: boolean;
  href?: string;
}

export const getLatestScore = (scores: ScoreRecord[] = []) =>
  [...scores].sort(
    (left, right) =>
      new Date(right.submittedAt || right.playedDate).getTime() -
      new Date(left.submittedAt || left.playedDate).getTime()
  )[0] || null;

export const getUnreadNotificationsCount = (notifications: NotificationRecord[] = []) =>
  notifications.filter((notification) => !notification.readAt).length;

export const getTotalWinnerPrizeMinor = (winners: WinnerRecord[] = []) =>
  winners.reduce((total, winner) => total + (winner.prizeAmountMinor || 0), 0);

export const getActiveOrLatestSubscription = (subscriptions: SubscriptionRecord[] = []) =>
  getCurrentSubscription(subscriptions);

export const getSelectedCharity = ({
  charities,
  selection
}: {
  charities?: CharityRecord[];
  selection?: CharitySelectionRecord | null;
}) =>
  charities?.find((charity) => charity.id === selection?.charityId) || null;

export const buildReadinessChecklist = ({
  profileStatus,
  charitySelection,
  subscription,
  scoreEligibility
}: {
  profileStatus?: ProfileVerificationState | null;
  charitySelection?: CharitySelectionRecord | null;
  subscription?: SubscriptionRecord | null;
  scoreEligibility?: ScoreEligibilityState | null;
}) => {
  const items: ReadinessChecklistItem[] = [
    {
      key: "email",
      label: "Verify your email",
      description: "Email verification has to complete before paid activation can finish.",
      completed: Boolean(profileStatus?.emailVerified),
      href: "/app/profile"
    },
    {
      key: "profile-completion",
      label: "Complete your profile",
      description: "Identity and address fields must be filled before review can settle.",
      completed: Boolean(profileStatus?.profileCompleted),
      href: "/app/profile"
    },
    {
      key: "profile-review",
      label: "Clear profile verification",
      description: "The backend keeps subscription readiness gated until profile review is verified.",
      completed: profileStatus?.profileVerificationStatus === "verified",
      href: "/app/profile"
    },
    {
      key: "charity",
      label: "Choose your charity",
      description: "The charity selection applies to future payments and draw-linked impact.",
      completed: Boolean(charitySelection?.charityId),
      href: "/app/charities"
    },
    {
      key: "subscription",
      label: "Activate your subscription",
      description: "A confirmed payment and an eligible profile are both required for activation.",
      completed: subscription?.status === "active",
      href: "/app/subscriptions"
    },
    {
      key: "scores",
      label: "Maintain five qualifying scores",
      description: "Your latest five qualifying submissions become your contest numbers.",
      completed: Boolean(scoreEligibility?.isEligible),
      href: "/app/scores"
    }
  ];

  return {
    items,
    completedCount: items.filter((item) => item.completed).length,
    remainingCount: items.filter((item) => !item.completed).length,
    ready:
      Boolean(profileStatus?.eligibleForSubscription) &&
      subscription?.status === "active" &&
      Boolean(scoreEligibility?.isEligible)
  };
};

export const getDrawReadinessState = ({
  profileStatus,
  subscription,
  scoreEligibility
}: {
  profileStatus?: ProfileVerificationState | null;
  subscription?: SubscriptionRecord | null;
  scoreEligibility?: ScoreEligibilityState | null;
}) => {
  if (
    profileStatus?.eligibleForSubscription &&
    subscription?.status === "active" &&
    scoreEligibility?.isEligible
  ) {
    return {
      label: "On track",
      description:
        "Your account currently meets the profile, subscription, and score conditions needed for upcoming monthly draw participation.",
      tone: "success" as const
    };
  }

  if (subscription?.status === "grace_period") {
    return {
      label: "Grace period",
      description:
        "Your subscription is still in grace. If it lapses by draw day, upcoming participation stops.",
      tone: "warning" as const
    };
  }

  return {
    label: "Needs attention",
    description:
      scoreEligibility?.reasons?.length
        ? getEligibilityReasonLabels(scoreEligibility).join(", ")
        :
          "Finish the remaining verification, billing, or score steps to become draw-ready again.",
    tone: "warning" as const
  };
};

export const getRecentActivityItems = ({
  notifications,
  scores,
  payments,
  winners
}: {
  notifications?: NotificationRecord[];
  scores?: ScoreRecord[];
  payments?: Array<{ id: string; state: string; updatedAt?: string; createdAt?: string }>;
  winners?: WinnerRecord[];
}) => {
  const feed = [
    ...(notifications || []).map((notification) => ({
      id: `notification:${notification.id}`,
      title: notification.title,
      description: notification.message,
      happenedAt: notification.createdAt || "",
      kind: "notification"
    })),
    ...(scores || []).slice(0, 3).map((score) => ({
      id: `score:${score.id}`,
      title: `Score ${score.value} saved`,
      description: `Contest number ${score.contestNumber} from ${score.playedDate}`,
      happenedAt: score.submittedAt || score.playedDate,
      kind: "score"
    })),
    ...(payments || []).slice(0, 3).map((payment) => ({
      id: `payment:${payment.id}`,
      title: `Payment ${payment.state.replace(/_/g, " ")}`,
      description: "Billing state came from the backend payment record.",
      happenedAt: payment.updatedAt || payment.createdAt || "",
      kind: "payment"
    })),
    ...(winners || []).slice(0, 3).map((winner) => ({
      id: `winner:${winner.id}`,
      title: `${winner.matchCount}-match result recorded`,
      description: `Winner status is ${winner.payoutStatus.replace(/_/g, " ")}.`,
      happenedAt: winner.updatedAt || winner.createdAt || "",
      kind: "winner"
    }))
  ];

  return feed
    .sort(
      (left, right) =>
        new Date(right.happenedAt || 0).getTime() - new Date(left.happenedAt || 0).getTime()
    )
    .slice(0, 6);
};

export const getSucceededDonationTotalMinor = (donations: CharityDonationRecord[] = []) =>
  donations
    .filter((donation) => donation.status === "succeeded")
    .reduce((total, donation) => total + donation.amountMinor, 0);
