export const SUBSCRIPTION_PLAN_CODES = Object.freeze({
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  YEARLY: "yearly",
});

export const SUBSCRIPTION_STATUSES = Object.freeze({
  PENDING_PAYMENT: "pending_payment",
  ACTIVE: "active",
  CANCELED: "canceled",
  GRACE_PERIOD: "grace_period",
  EXPIRED: "expired",
  PAYMENT_FAILED: "payment_failed",
});

export const SUBSCRIPTION_HISTORY_EVENT_TYPES = Object.freeze({
  CREATED: "created",
  PAYMENT_CONFIRMED: "payment_confirmed",
  PAYMENT_FAILED: "payment_failed",
  RENEWAL_FAILED: "renewal_failed",
  GRACE_PERIOD_STARTED: "grace_period_started",
  GRACE_PERIOD_ENDED: "grace_period_ended",
  UPGRADED: "upgraded",
  CANCELED: "canceled",
  PLAN_UPDATED: "plan_updated",
  COUPON_APPLIED: "coupon_applied",
  ADMIN_MANUAL_ADJUSTMENT: "admin_manual_adjustment",
});

export const COUPON_DISCOUNT_TYPES = Object.freeze({
  PERCENTAGE: "percentage",
  FLAT: "flat",
});

export const SUBSCRIPTION_CURRENCIES = Object.freeze({
  INR: "INR",
});

export const SUBSCRIPTION_UPGRADE_PATHS = Object.freeze({
  [SUBSCRIPTION_PLAN_CODES.MONTHLY]: [
    SUBSCRIPTION_PLAN_CODES.QUARTERLY,
    SUBSCRIPTION_PLAN_CODES.YEARLY,
  ],
  [SUBSCRIPTION_PLAN_CODES.QUARTERLY]: [SUBSCRIPTION_PLAN_CODES.YEARLY],
  [SUBSCRIPTION_PLAN_CODES.YEARLY]: [],
});

export const DEFAULT_SUBSCRIPTION_PLANS = Object.freeze([
  {
    code: SUBSCRIPTION_PLAN_CODES.MONTHLY,
    name: "Monthly",
    description: "Monthly plan with recurring billing.",
    priceInr: 179,
    billingCycleDays: 30,
    hierarchyLevel: 1,
    isDefault: true,
    isActive: true,
  },
  {
    code: SUBSCRIPTION_PLAN_CODES.QUARTERLY,
    name: "Quarterly",
    description: "Quarterly plan with recurring billing.",
    priceInr: 499,
    billingCycleDays: 90,
    hierarchyLevel: 2,
    isDefault: true,
    isActive: true,
  },
  {
    code: SUBSCRIPTION_PLAN_CODES.YEARLY,
    name: "Yearly",
    description: "Yearly plan with recurring billing.",
    priceInr: 1999,
    billingCycleDays: 365,
    hierarchyLevel: 3,
    isDefault: true,
    isActive: true,
  },
]);
