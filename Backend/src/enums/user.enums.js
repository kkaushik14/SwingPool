export const USER_ROLES = Object.freeze({
  USER: "user",
  ADMIN: "admin",
});

export const SUBSCRIPTION_STATUSES = Object.freeze({
  FREE: "free",
  ACTIVE: "active",
  PAST_DUE: "past_due",
  CANCELED: "canceled",
});

export const USER_STATUSES = Object.freeze({
  PENDING_VERIFICATION: "pending_verification",
  VERIFIED: "verified",
  SUSPENDED: "suspended",
  INACTIVE: "inactive",
});

export const PROFILE_COMPLETION_STATUSES = Object.freeze({
  INCOMPLETE: "incomplete",
  COMPLETED: "completed",
});

export const PROFILE_VERIFICATION_STATUSES = Object.freeze({
  PENDING_VERIFICATION: "pending_verification",
  VERIFIED: "verified",
  REJECTED: "rejected",
});
