import { config } from "../config/index.js";
import { createScopedLogger } from "../logger/index.js";

import { JOB_NAMES } from "./jobs.enums.js";
import { runDrawExecutionJob } from "./draw-execution.job.js";
import { runExpiryEnforcementJob } from "./expiry-enforcement.job.js";
import { runGracePeriodCheckJob } from "./grace-period-check.job.js";
import { runMonthlyDrawJob } from "./monthly-draw.job.js";
import { runPaymentReconciliationJob } from "./payment-reconciliation.job.js";
import { runRenewalReminderJob } from "./renewal-reminder.job.js";
import { runWinnerProofDeadlineJob } from "./winner-proof-deadline.job.js";

const schedulerLogger = createScopedLogger("jobs-scheduler");

const schedulerState = {
  started: false,
  intervals: [],
  immediateTimeouts: [],
  inFlight: new Map(),
};

export const shouldStartJobScheduler = ({
  jobsEnabled = config.jobs.enabled,
  databaseConnected = true,
} = {}) => {
  return Boolean(jobsEnabled && databaseConnected);
};

const clearAllTimers = () => {
  for (const intervalId of schedulerState.intervals) {
    clearInterval(intervalId);
  }

  for (const timeoutId of schedulerState.immediateTimeouts) {
    clearTimeout(timeoutId);
  }

  schedulerState.intervals = [];
  schedulerState.immediateTimeouts = [];
};

const runSafely = async (jobName, runner) => {
  if (schedulerState.inFlight.get(jobName)) {
    schedulerLogger.warn(
      {
        jobName,
      },
      "Skipping job tick because previous run is still in flight",
    );
    return;
  }

  schedulerState.inFlight.set(jobName, true);

  try {
    await runner();
  } catch (error) {
    schedulerLogger.error(
      {
        jobName,
        error: error.message,
      },
      "Scheduled job tick failed",
    );
  } finally {
    schedulerState.inFlight.set(jobName, false);
  }
};

const scheduleJob = ({ jobName, intervalMs, runner }) => {
  const intervalId = setInterval(() => {
    void runSafely(jobName, runner);
  }, intervalMs);

  intervalId.unref?.();
  schedulerState.intervals.push(intervalId);

  const timeoutId = setTimeout(() => {
    void runSafely(jobName, runner);
  }, 1000);

  timeoutId.unref?.();
  schedulerState.immediateTimeouts.push(timeoutId);
};

export const startJobScheduler = ({ databaseConnected = true } = {}) => {
  if (schedulerState.started) {
    return;
  }

  if (!shouldStartJobScheduler({ databaseConnected })) {
    if (!config.jobs.enabled) {
      schedulerLogger.info("Job scheduler is disabled by configuration");
      return;
    }

    schedulerLogger.info(
      "Skipping job scheduler because database connection is unavailable",
    );
    return;
  }

  const scheduledJobs = [
    {
      jobName: JOB_NAMES.RENEWAL_REMINDER,
      intervalMs: config.jobs.renewalReminderIntervalMs,
      runner: () => runRenewalReminderJob(),
    },
    {
      jobName: JOB_NAMES.GRACE_PERIOD_CHECK,
      intervalMs: config.jobs.gracePeriodCheckIntervalMs,
      runner: () => runGracePeriodCheckJob(),
    },
    {
      jobName: JOB_NAMES.EXPIRY_ENFORCEMENT,
      intervalMs: config.jobs.expiryEnforcementIntervalMs,
      runner: () => runExpiryEnforcementJob(),
    },
    {
      jobName: JOB_NAMES.MONTHLY_DRAW_PREPARATION,
      intervalMs: config.jobs.monthlyDrawPreparationIntervalMs,
      runner: () => runMonthlyDrawJob(),
    },
    {
      jobName: JOB_NAMES.DRAW_EXECUTION,
      intervalMs: config.jobs.drawExecutionIntervalMs,
      runner: () => runDrawExecutionJob(),
    },
    {
      jobName: JOB_NAMES.WINNER_PROOF_DEADLINE_CHECK,
      intervalMs: config.jobs.winnerProofCheckIntervalMs,
      runner: () => runWinnerProofDeadlineJob(),
    },
    {
      jobName: JOB_NAMES.PAYMENT_RECONCILIATION,
      intervalMs: config.jobs.paymentReconciliationIntervalMs,
      runner: () => runPaymentReconciliationJob(),
    },
  ];

  for (const item of scheduledJobs) {
    scheduleJob(item);
  }

  schedulerState.started = true;

  schedulerLogger.info(
    {
      jobs: scheduledJobs.map((item) => ({
        jobName: item.jobName,
        intervalMs: item.intervalMs,
      })),
    },
    "Job scheduler started",
  );
};

export const stopJobScheduler = () => {
  if (!schedulerState.started) {
    clearAllTimers();
    return;
  }

  clearAllTimers();
  schedulerState.inFlight.clear();
  schedulerState.started = false;

  schedulerLogger.info("Job scheduler stopped");
};
