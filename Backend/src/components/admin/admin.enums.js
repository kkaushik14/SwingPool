export const ADMIN_AUDIT_ENTITIES = Object.freeze({
  USER: "User",
  USER_PROFILE: "UserProfile",
  PLAN: "SubscriptionPlan",
  COUPON: "SubscriptionCoupon",
  SUBSCRIPTION: "Subscription",
  PAYMENT: "Payment",
  DONATION: "CharityDonation",
  PAYOUT: "CharityPayoutLedger",
  CHARITY: "Charity",
  SCORE: "Score",
  DRAW: "Draw",
  WINNER: "Winner",
  WINNER_PROOF: "WinnerProofSubmission",
  AUDIT_EVENT: "AuditEvent",
  REPORT: "Report",
});

export const ADMIN_STATUSES = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  ARCHIVED: "archived",
});

export const ADMIN_SENSITIVE_OPERATIONS = Object.freeze({
  USER_UPDATE: "admin.users.update",
  USER_PROFILE_VERIFICATION: "admin.users.profile_verification",
  PLAN_UPDATE: "admin.plans.update",
  COUPON_UPDATE: "admin.coupons.update",
  SUBSCRIPTION_CANCEL: "admin.subscriptions.cancel",
  SUBSCRIPTION_MANUAL_ADJUSTMENT: "admin.subscriptions.manual_adjustment",
  PAYMENT_MANUAL_ADJUSTMENT: "admin.payments.manual_adjustment",
  DONATION_MANUAL_ADJUSTMENT: "admin.donations.manual_adjustment",
  PAYOUT_UPDATE: "admin.payouts.update",
  DRAW_MANUAL_ADJUSTMENT: "admin.draws.manual_adjustment",
  JACKPOT_TOPUP: "admin.draws.jackpot_topup",
  WINNER_PROOF_REVIEW: "admin.winners.proof_review",
  WINNER_PAYOUT_UPDATE: "admin.winners.payout_update",
});

export const ADMIN_ACTIONS = Object.freeze({
  USERS_LIST: "admin.users.list",
  USER_GET: "admin.users.get",
  USER_UPDATE: "admin.users.update",
  USER_PROFILE_VERIFICATION: "admin.users.profile_verification",

  PLANS_LIST: "admin.plans.list",
  PLAN_CREATE: "admin.plans.create",
  PLAN_UPDATE: "admin.plans.update",

  COUPONS_LIST: "admin.coupons.list",
  COUPON_CREATE: "admin.coupons.create",
  COUPON_UPDATE: "admin.coupons.update",

  SUBSCRIPTION_CONFIG_GET: "admin.subscriptions.config.get",
  SUBSCRIPTION_CONFIG_UPDATE: "admin.subscriptions.config.update",
  SUBSCRIPTIONS_LIST: "admin.subscriptions.list",
  SUBSCRIPTION_GET: "admin.subscriptions.get",
  SUBSCRIPTION_CANCEL: "admin.subscriptions.cancel",
  SUBSCRIPTION_RENEWAL_FAILED: "admin.subscriptions.renewal_failed",
  SUBSCRIPTION_GRACE_PROCESS: "admin.subscriptions.grace_process",
  SUBSCRIPTION_MANUAL_ADJUSTMENT: "admin.subscriptions.manual_adjustment",

  PAYMENTS_LIST: "admin.payments.list",
  PAYMENT_GET: "admin.payments.get",
  PAYMENT_LEDGER_LIST: "admin.payments.ledger.list",
  PAYMENT_TIMEOUT_PROCESS: "admin.payments.timeout.process",
  PAYMENT_MANUAL_ADJUSTMENT: "admin.payments.manual_adjustment",

  CHARITIES_LIST: "admin.charities.list",
  CHARITY_CREATE: "admin.charities.create",
  CHARITY_UPDATE: "admin.charities.update",
  CHARITY_RULE_GET: "admin.charities.rule.get",
  CHARITY_RULE_UPDATE: "admin.charities.rule.update",
  DONATIONS_LIST: "admin.donations.list",
  DONATION_MANUAL_ADJUSTMENT: "admin.donations.manual_adjustment",
  PAYOUTS_LIST: "admin.payouts.list",
  PAYOUT_CREATE: "admin.payouts.create",
  PAYOUT_UPDATE: "admin.payouts.update",
  CHARITY_MANUAL_ADJUSTMENT: "admin.charities.adjustment.create",

  SCORES_LIST: "admin.scores.list",
  SCORE_UPDATE: "admin.scores.update",

  DRAWS_LIST: "admin.draws.list",
  DRAW_GET: "admin.draws.get",
  DRAW_CREATE: "admin.draws.create",
  DRAW_UPDATE: "admin.draws.update",
  DRAW_ENTRIES_GENERATE: "admin.draws.entries.generate",
  DRAW_SIMULATION_CREATE: "admin.draws.simulation.create",
  DRAW_SIMULATIONS_LIST: "admin.draws.simulation.list",
  DRAW_PUBLISH: "admin.draws.publish",
  DRAW_RESULT_GET: "admin.draws.result.get",
  DRAW_PRIZE_POOL_GET: "admin.draws.prize_pool.get",
  DRAW_JACKPOT_TOPUP: "admin.draws.jackpot.topup",
  DRAW_JACKPOT_LEDGER_LIST: "admin.draws.jackpot.ledger.list",

  WINNERS_LIST: "admin.winners.list",
  WINNER_GET: "admin.winners.get",
  WINNER_PROOFS_LIST: "admin.winners.proofs.list",
  WINNER_PROOF_REVIEW: "admin.winners.proof.review",
  WINNER_PAYOUT_UPDATE: "admin.winners.payout.update",

  AUDIT_EVENTS_LIST: "admin.audit_events.list",
});

export const ADMIN_MANUAL_SUBSCRIPTION_FIELDS = Object.freeze([
  "status",
  "autoRenew",
  "startAt",
  "endAt",
  "nextBillingAt",
  "gracePeriodEndsAt",
  "canceledAt",
  "metadata",
  "lastPaymentStatus",
]);

export const ADMIN_MANUAL_PAYMENT_FIELDS = Object.freeze([
  "state",
  "stateReason",
  "timeoutAt",
  "finalizedAt",
  "mismatchDetected",
  "metadata",
]);

export const ADMIN_MANUAL_DONATION_FIELDS = Object.freeze([
  "status",
  "finalizedAt",
  "userMessage",
  "metadata",
]);
