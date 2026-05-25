import type {
  NotificationRecord,
  ProfileVerificationState,
  SubscriptionRecord,
  WinnerRecord
} from "@/types";
import { routePaths } from "@/routes/paths";
import { formatDateTime } from "@/utils";

export type NotificationCategory = "account" | "billing" | "draws" | "system";
export type NotificationTone = "success" | "warning" | "danger" | "info";
export type NotificationFilterValue =
  | "all"
  | "unread"
  | "account"
  | "billing"
  | "draws";
export type AccountStatusSurface =
  | "banner"
  | "dashboard"
  | "profile"
  | "billing"
  | "draws"
  | "notifications";

export interface NotificationEventMeta {
  label: string;
  tone: NotificationTone;
  category: NotificationCategory;
  priority: number;
}

export interface AccountStatusNotice {
  id: string;
  label: string;
  title: string;
  description: string;
  tone: NotificationTone;
  priority: number;
  href?: string;
  actionLabel?: string;
  surfaces: readonly AccountStatusSurface[];
}

const EVENT_META_MAP: Record<string, NotificationEventMeta> = {
  signup_verification: {
    label: "Verification",
    tone: "warning",
    category: "account",
    priority: 100
  },
  payment_success: {
    label: "Payment",
    tone: "success",
    category: "billing",
    priority: 50
  },
  payment_failure: {
    label: "Payment issue",
    tone: "danger",
    category: "billing",
    priority: 95
  },
  renewal_reminder: {
    label: "Renewal",
    tone: "info",
    category: "billing",
    priority: 45
  },
  grace_period_warning: {
    label: "Grace period",
    tone: "danger",
    category: "billing",
    priority: 98
  },
  subscription_expiry: {
    label: "Expiry",
    tone: "danger",
    category: "billing",
    priority: 96
  },
  draw_published: {
    label: "Draw result",
    tone: "info",
    category: "draws",
    priority: 40
  },
  winner_selected: {
    label: "Winner update",
    tone: "success",
    category: "draws",
    priority: 70
  },
  proof_rejected: {
    label: "Proof rejected",
    tone: "danger",
    category: "draws",
    priority: 97
  },
  payout_completed: {
    label: "Payout",
    tone: "success",
    category: "draws",
    priority: 60
  }
};

const ACTION_REQUIRED_EVENT_TYPES = new Set([
  "signup_verification",
  "payment_failure",
  "grace_period_warning",
  "subscription_expiry",
  "proof_rejected"
]);

const toTimestamp = (value?: string | null) => new Date(value || 0).getTime();

export const notificationFilterOptions = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "account", label: "Account" },
  { value: "billing", label: "Billing" },
  { value: "draws", label: "Draws" }
] satisfies Array<{ value: NotificationFilterValue; label: string }>;

export const getNotificationEventMeta = (eventType?: string | null): NotificationEventMeta =>
  EVENT_META_MAP[eventType || ""] || {
    label: "Notification",
    tone: "info",
    category: "system",
    priority: 10
  };

export const sortNotificationsForInbox = (notifications: NotificationRecord[] = []) =>
  [...notifications].sort((left, right) => {
    const leftMeta = getNotificationEventMeta(left.eventType);
    const rightMeta = getNotificationEventMeta(right.eventType);

    if (Boolean(left.readAt) !== Boolean(right.readAt)) {
      return left.readAt ? 1 : -1;
    }

    if (leftMeta.priority !== rightMeta.priority) {
      return rightMeta.priority - leftMeta.priority;
    }

    return toTimestamp(right.createdAt) - toTimestamp(left.createdAt);
  });

export const filterNotifications = ({
  notifications,
  filter
}: {
  notifications: NotificationRecord[];
  filter: NotificationFilterValue;
}) => {
  if (filter === "all") {
    return notifications;
  }

  if (filter === "unread") {
    return notifications.filter((notification) => !notification.readAt);
  }

  return notifications.filter(
    (notification) => getNotificationEventMeta(notification.eventType).category === filter
  );
};

export const getNotificationSummary = (notifications: NotificationRecord[] = []) => {
  const summary = {
    totalCount: notifications.length,
    unreadCount: 0,
    actionRequiredCount: 0,
    billingCount: 0,
    drawCount: 0,
    accountCount: 0
  };

  notifications.forEach((notification) => {
    const meta = getNotificationEventMeta(notification.eventType);

    if (!notification.readAt) {
      summary.unreadCount += 1;
    }

    if (!notification.readAt && ACTION_REQUIRED_EVENT_TYPES.has(notification.eventType)) {
      summary.actionRequiredCount += 1;
    }

    if (meta.category === "billing") {
      summary.billingCount += 1;
    }

    if (meta.category === "draws") {
      summary.drawCount += 1;
    }

    if (meta.category === "account") {
      summary.accountCount += 1;
    }
  });

  return summary;
};

export const selectNotificationsPreview = (
  notifications: NotificationRecord[] = [],
  limit = 6
) => sortNotificationsForInbox(notifications).slice(0, limit);

export const formatNotificationTimestamp = (createdAt?: string) =>
  formatDateTime(createdAt) || "Pending sync";

export const selectAccountStatusNotices = ({
  profileStatus,
  subscription,
  winners,
  now = new Date()
}: {
  profileStatus?: ProfileVerificationState | null;
  subscription?: SubscriptionRecord | null;
  winners?: WinnerRecord[];
  now?: Date;
}) => {
  const notices: AccountStatusNotice[] = [];
  const winnerRecords = winners || [];

  if (!profileStatus?.emailVerified) {
    notices.push({
      id: "email-verification",
      label: "Verification required",
      title: "Verify your email before paid activation can complete",
      description:
        "The backend keeps account activation blocked until email verification is confirmed.",
      tone: "warning",
      priority: 100,
      href: routePaths.profile,
      actionLabel: "Open profile",
      surfaces: ["banner", "dashboard", "profile", "notifications"]
    });
  }

  if (profileStatus?.emailVerified && !profileStatus.profileCompleted) {
    notices.push({
      id: "profile-completion",
      label: "Profile incomplete",
      title: "Finish your profile details to move into review",
      description:
        "Identity and address fields are still missing, so subscription activation remains blocked.",
      tone: "warning",
      priority: 95,
      href: routePaths.profile,
      actionLabel: "Complete profile",
      surfaces: ["banner", "dashboard", "profile"]
    });
  }

  if (profileStatus?.profileVerificationStatus === "pending_verification") {
    notices.push({
      id: "profile-review-pending",
      label: "Review in progress",
      title: "Profile review is still pending",
      description:
        "You can continue exploring the account area, but paid activation stays gated until review is verified.",
      tone: "info",
      priority: 70,
      href: routePaths.profile,
      actionLabel: "See status",
      surfaces: ["dashboard", "profile", "notifications"]
    });
  }

  if (profileStatus?.profileVerificationStatus === "suspended") {
    notices.push({
      id: "profile-suspended",
      label: "Account review issue",
      title: "Profile verification is currently suspended",
      description:
        "Billing and draw readiness are paused until support or admin review resolves the verification issue.",
      tone: "danger",
      priority: 99,
      href: routePaths.contact,
      actionLabel: "Contact support",
      surfaces: ["banner", "dashboard", "profile", "billing", "draws", "notifications"]
    });
  }

  if (subscription?.status === "grace_period") {
    notices.push({
      id: "subscription-grace-period",
      label: "Grace period",
      title: "Your subscription is in grace period",
      description: subscription.gracePeriodEndsAt
        ? `Payment needs to settle before ${formatDateTime(subscription.gracePeriodEndsAt)} or eligibility can lapse.`
        : "Payment needs to settle soon or eligibility can lapse before the next draw.",
      tone: "danger",
      priority: 98,
      href: routePaths.subscriptions,
      actionLabel: "Open billing",
      surfaces: ["banner", "dashboard", "billing", "draws", "notifications"]
    });
  }

  if (subscription?.status === "expired") {
    notices.push({
      id: "subscription-expired",
      label: "Subscription expired",
      title: "Your subscription has expired",
      description:
        "The backend no longer treats this membership as active, so upcoming draw participation is paused until billing resumes.",
      tone: "danger",
      priority: 97,
      href: routePaths.subscriptions,
      actionLabel: "Renew membership",
      surfaces: ["banner", "dashboard", "billing", "draws", "notifications"]
    });
  }

  if (subscription?.status === "cancelled") {
    notices.push({
      id: "subscription-cancelled",
      label: "Cancelled",
      title: "Auto-renew is no longer active",
      description:
        "Your cancellation is immediate under the current backend rules, so keep an eye on eligibility and choose a new plan when you are ready.",
      tone: "info",
      priority: 68,
      href: routePaths.subscriptions,
      actionLabel: "Review plans",
      surfaces: ["dashboard", "billing", "notifications"]
    });
  }

  const rejectedWinner = [...winnerRecords]
    .filter((winner) => winner.payoutStatus === "rejected")
    .sort((left, right) => toTimestamp(right.rejectedAt || right.updatedAt) - toTimestamp(left.rejectedAt || left.updatedAt))[0];

  if (rejectedWinner) {
    notices.push({
      id: `winner-rejected:${rejectedWinner.id}`,
      label: "Proof rejected",
      title: "A winning proof needs resubmission",
      description: rejectedWinner.rejectionReason
        ? `Reason: ${rejectedWinner.rejectionReason}`
        : "The backend marked a proof submission as rejected, so a corrected resubmission is needed before payout can move forward.",
      tone: "danger",
      priority: 96,
      href: routePaths.draws,
      actionLabel: "Review winnings",
      surfaces: ["banner", "dashboard", "draws", "notifications"]
    });
  }

  const pendingProofWinner = [...winnerRecords]
    .filter((winner) => winner.payoutStatus === "pending_verification")
    .sort(
      (left, right) =>
        toTimestamp(left.verificationDeadlineAt || left.updatedAt) -
        toTimestamp(right.verificationDeadlineAt || right.updatedAt)
    )[0];

  if (pendingProofWinner) {
    notices.push({
      id: `winner-proof:${pendingProofWinner.id}`,
      label: "Proof deadline",
      title: "A winning proof still needs submission",
      description: pendingProofWinner.verificationDeadlineAt
        ? `Proof must be submitted before ${formatDateTime(pendingProofWinner.verificationDeadlineAt)}.`
        : "Proof is still required before payout review can begin.",
      tone: "warning",
      priority: 89,
      href: routePaths.draws,
      actionLabel: "Submit proof",
      surfaces: ["dashboard", "draws", "notifications"]
    });
  }

  const payoutPendingWinner = [...winnerRecords]
    .filter((winner) =>
      winner.payoutStatus === "approved" || winner.payoutStatus === "payout_pending"
    )
    .sort((left, right) => toTimestamp(right.updatedAt) - toTimestamp(left.updatedAt))[0];

  if (payoutPendingWinner) {
    notices.push({
      id: `winner-payout:${payoutPendingWinner.id}`,
      label: "Payout update",
      title:
        payoutPendingWinner.payoutStatus === "approved"
          ? "Your winning proof has been approved"
          : "Your payout is moving through the payout queue",
      description:
        payoutPendingWinner.payoutStatus === "approved"
          ? "Verification is complete and the payout workflow is preparing the final transfer."
          : "The backend has accepted the claim and is now preparing the transfer details.",
      tone: "info",
      priority: 58,
      href: routePaths.draws,
      actionLabel: "View winnings",
      surfaces: ["dashboard", "draws", "notifications"]
    });
  }

  const recentlyPaidWinner = [...winnerRecords]
    .filter((winner) => winner.payoutStatus === "paid")
    .sort((left, right) => toTimestamp(right.paidAt || right.updatedAt) - toTimestamp(left.paidAt || left.updatedAt))[0];

  if (
    recentlyPaidWinner &&
    now.getTime() - toTimestamp(recentlyPaidWinner.paidAt || recentlyPaidWinner.updatedAt) <
      1000 * 60 * 60 * 24 * 14
  ) {
    notices.push({
      id: `winner-paid:${recentlyPaidWinner.id}`,
      label: "Payout completed",
      title: "A recent payout has completed successfully",
      description: recentlyPaidWinner.paidAt
        ? `The latest payout completed on ${formatDateTime(recentlyPaidWinner.paidAt)}.`
        : "The latest winning payout is complete.",
      tone: "success",
      priority: 40,
      href: routePaths.draws,
      actionLabel: "See payout details",
      surfaces: ["dashboard", "draws", "notifications"]
    });
  }

  return notices.sort((left, right) => right.priority - left.priority);
};

export const filterStatusNoticesBySurface = ({
  notices,
  surface
}: {
  notices: AccountStatusNotice[];
  surface: AccountStatusSurface;
}) => notices.filter((notice) => notice.surfaces.includes(surface));
