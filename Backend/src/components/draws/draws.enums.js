export const DRAW_MODES = Object.freeze({
  RANDOM: "random",
  ALGORITHMIC: "algorithmic",
});

export const DRAW_SNAPSHOT_STATUSES = Object.freeze({
  DRAFT: "draft",
  ENTRIES_LOCKED: "entries_locked",
  PUBLISHED: "published",
  CANCELLED: "cancelled",
});

export const DRAW_ENTRY_SOURCES = Object.freeze({
  AUTOMATIC: "automatic",
});

export const DRAW_SIMULATION_STATUSES = Object.freeze({
  COMPLETED: "completed",
});

export const DRAW_PUBLISHED_RESULT_STATUSES = Object.freeze({
  PUBLISHED: "published",
});

export const DRAW_PRIZE_POOL_SNAPSHOT_STRATEGIES = Object.freeze({
  DRAW_DAY: "draw_day",
  MONTH_END: "month_end",
});

export const DRAW_JACKPOT_LEDGER_ENTRY_TYPES = Object.freeze({
  MANUAL_FUND: "manual_fund",
  ROLLOVER_IN: "rollover_in",
  ROLLOVER_OUT: "rollover_out",
  JACKPOT_PAYOUT: "jackpot_payout",
});

export const DRAW_JACKPOT_LEDGER_DIRECTIONS = Object.freeze({
  CREDIT: "credit",
  DEBIT: "debit",
});

export const DRAW_DEFAULT_PRIZE_DISTRIBUTION = Object.freeze({
  match3Percentage: 20,
  match4Percentage: 30,
  match5Percentage: 50,
});

export const DRAW_DEFAULT_CONFIG = Object.freeze({
  MODE: DRAW_MODES.RANDOM,
  NUMBER_RANGE_MIN: 1,
  NUMBER_RANGE_MAX: 45,
  NUMBERS_PER_DRAW: 5,
  ELIGIBILITY_CUTOFF_DAYS_BEFORE_MONTH_END: 7,
  PROOF_DEADLINE_DAYS: 23,
  MAX_PROOF_FILES: 2,
  PRIZE_DISTRIBUTION: DRAW_DEFAULT_PRIZE_DISTRIBUTION,
});
