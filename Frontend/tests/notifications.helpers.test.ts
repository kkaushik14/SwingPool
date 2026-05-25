import { describe, expect, it } from "vitest";

import {
  filterNotifications,
  getNotificationSummary,
  selectAccountStatusNotices,
  sortNotificationsForInbox
} from "@/features/notifications";
import type {
  NotificationRecord,
  ProfileVerificationState,
  SubscriptionRecord,
  WinnerRecord
} from "@/types";

const notifications: NotificationRecord[] = [
  {
    id: "notification-payment-failure",
    title: "Payment failed",
    message: "Action required.",
    eventType: "payment_failure",
    createdAt: "2026-04-25T10:00:00.000Z"
  },
  {
    id: "notification-draw",
    title: "Draw published",
    message: "Results are live.",
    eventType: "draw_published",
    readAt: "2026-04-25T11:00:00.000Z",
    createdAt: "2026-04-25T09:00:00.000Z"
  },
  {
    id: "notification-verification",
    title: "Verify your account",
    message: "Finish signup.",
    eventType: "signup_verification",
    createdAt: "2026-04-25T12:00:00.000Z"
  }
];

const profileStatus: ProfileVerificationState = {
  userId: "user-1",
  userStatus: "active",
  emailVerified: false,
  profileCompleted: true,
  profileVerificationStatus: "pending_verification",
  eligibleForSubscription: false
};

const subscription: SubscriptionRecord = {
  id: "subscription-1",
  userId: "user-1",
  planCode: "quarterly",
  planNameSnapshot: "Quarterly",
  planPriceInrSnapshot: 499,
  status: "grace_period",
  gracePeriodEndsAt: "2026-04-30T10:00:00.000Z"
};

const winners: WinnerRecord[] = [
  {
    id: "winner-1",
    drawId: "draw-1",
    publishedResultId: "published-result-1",
    entryId: "entry-1",
    userId: "user-1",
    matchCount: 4,
    contestNumbers: [1, 2, 3, 4, 5],
    matchedNumbers: [1, 2, 3, 4],
    prizeAmountMinor: 250000,
    prizeAmountMajor: "2500.00",
    payoutStatus: "rejected",
    rejectionReason: "Image too blurry",
    updatedAt: "2026-04-25T10:00:00.000Z"
  }
];

describe("notifications helpers", () => {
  it("sorts unread and higher-priority notifications first", () => {
    const sorted = sortNotificationsForInbox(notifications);

    expect(sorted.map((notification) => notification.id)).toEqual([
      "notification-verification",
      "notification-payment-failure",
      "notification-draw"
    ]);
  });

  it("filters notifications by category and summarizes unread action-required counts", () => {
    const billingNotifications = filterNotifications({
      notifications,
      filter: "billing"
    });
    const summary = getNotificationSummary(notifications);

    expect(billingNotifications).toHaveLength(1);
    expect(summary.unreadCount).toBe(2);
    expect(summary.actionRequiredCount).toBe(2);
  });

  it("derives urgent account status notices from profile, subscription, and winners", () => {
    const notices = selectAccountStatusNotices({
      profileStatus,
      subscription,
      winners,
      now: new Date("2026-04-25T12:00:00.000Z")
    });

    expect(notices[0]?.id).toBe("email-verification");
    expect(notices.some((notice) => notice.id === "subscription-grace-period")).toBe(true);
    expect(notices.some((notice) => notice.id === "winner-rejected:winner-1")).toBe(true);
  });
});
