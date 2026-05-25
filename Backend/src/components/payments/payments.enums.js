export const PAYMENT_STATES = Object.freeze({
  PROCESSING: "processing",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  CANCELED: "cancelled",
  TIMEOUT: "timeout",
  RETRY_REQUIRED: "retry_required",
});

export const PAYMENT_TERMINAL_STATES = Object.freeze([
  PAYMENT_STATES.SUCCEEDED,
  PAYMENT_STATES.FAILED,
  PAYMENT_STATES.CANCELED,
  PAYMENT_STATES.TIMEOUT,
]);

export const PAYMENT_LEDGER_ENTRY_TYPES = Object.freeze({
  INTENT_CREATED: "intent_created",
  PROCESSING: "processing",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  CANCELED: "cancelled",
  TIMEOUT: "timeout",
  RETRY_REQUIRED: "retry_required",
});

export const PAYMENT_LEDGER_DIRECTIONS = Object.freeze({
  DEBIT: "debit",
  CREDIT: "credit",
  NEUTRAL: "neutral",
});

export const STRIPE_WEBHOOK_EVENT_STATUSES = Object.freeze({
  PROCESSING: "processing",
  PROCESSED: "processed",
  FAILED: "failed",
  IGNORED: "ignored",
});
