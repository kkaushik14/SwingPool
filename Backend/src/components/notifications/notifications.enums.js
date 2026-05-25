export const NOTIFICATIONS_STATUSES = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  ARCHIVED: "archived",
});

export const NOTIFICATION_CHANNELS = Object.freeze({
  IN_APP: "in_app",
  EMAIL: "email",
  SMS: "sms",
});

export const NOTIFICATION_DELIVERY_STATUSES = Object.freeze({
  QUEUED: "queued",
  SENT: "sent",
  FAILED: "failed",
  SKIPPED: "skipped",
});

export const NOTIFICATION_EVENT_TYPES = Object.freeze({
  SIGNUP_VERIFICATION: "signup_verification",
  PAYMENT_SUCCESS: "payment_success",
  PAYMENT_FAILURE: "payment_failure",
  RENEWAL_REMINDER: "renewal_reminder",
  GRACE_PERIOD_WARNING: "grace_period_warning",
  SUBSCRIPTION_EXPIRY: "subscription_expiry",
  DRAW_PUBLISHED: "draw_published",
  WINNER_SELECTED: "winner_selected",
  PROOF_REJECTED: "proof_rejected",
  PAYOUT_COMPLETED: "payout_completed",
});
