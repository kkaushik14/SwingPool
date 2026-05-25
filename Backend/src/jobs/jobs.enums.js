export const JOB_EXECUTION_STATUSES = Object.freeze({
  RUNNING: "running",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  SKIPPED: "skipped",
});

export const JOB_NAMES = Object.freeze({
  RENEWAL_REMINDER: "renewal_reminder",
  GRACE_PERIOD_CHECK: "grace_period_check",
  EXPIRY_ENFORCEMENT: "expiry_enforcement",
  MONTHLY_DRAW_PREPARATION: "monthly_draw_preparation",
  DRAW_EXECUTION: "draw_execution",
  WINNER_PROOF_DEADLINE_CHECK: "winner_proof_deadline_check",
  PAYMENT_RECONCILIATION: "payment_reconciliation",
});
