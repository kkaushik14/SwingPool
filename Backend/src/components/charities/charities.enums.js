export const CHARITIES_STATUSES = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  ARCHIVED: "archived",
});

export const CHARITY_CURRENCIES = Object.freeze({
  INR: "INR",
});

export const CHARITY_SELECTION_STATUSES = Object.freeze({
  ACTIVE: "active",
  SUPERSEDED: "superseded",
});

export const CONTRIBUTION_RULE_STATUSES = Object.freeze({
  ACTIVE: "active",
  ARCHIVED: "archived",
});

export const DONATION_SOURCES = Object.freeze({
  INDEPENDENT: "independent",
  SUBSCRIPTION_ADDON: "subscription_addon",
});

export const DONATION_STATUSES = Object.freeze({
  PROCESSING: "processing",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  CANCELLED: "cancelled",
  TIMEOUT: "timeout",
  RETRY_REQUIRED: "retry_required",
});

export const CHARITY_ALLOCATION_ENTRY_TYPES = Object.freeze({
  GATEWAY_FEE: "gateway_fee",
  PRIZE_POOL: "prize_pool",
  MANDATORY_CHARITY: "mandatory_charity",
  OPTIONAL_CHARITY_ADDON: "optional_charity_addon",
  PLATFORM_REVENUE: "platform_revenue",
  INDEPENDENT_DONATION_CHARITY: "independent_donation_charity",
  MANUAL_ADJUSTMENT_CREDIT: "manual_adjustment_credit",
  MANUAL_ADJUSTMENT_DEBIT: "manual_adjustment_debit",
});

export const CHARITY_ALLOCATION_DIRECTIONS = Object.freeze({
  DEBIT: "debit",
  CREDIT: "credit",
  NEUTRAL: "neutral",
});

export const CHARITY_PAYOUT_ENTRY_TYPES = Object.freeze({
  PAYOUT: "payout",
  ADJUSTMENT_CREDIT: "adjustment_credit",
  ADJUSTMENT_DEBIT: "adjustment_debit",
});

export const CHARITY_PAYOUT_STATUSES = Object.freeze({
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
});
