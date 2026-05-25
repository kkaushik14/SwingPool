import { randomUUID } from "node:crypto";

import { createScopedLogger } from "../logger/index.js";

import { JOB_EXECUTION_STATUSES } from "./jobs.enums.js";
import { jobsRepository } from "./jobs.repository.js";

const jobsLogger = createScopedLogger("jobs");

const isDuplicateKeyError = (error) => error?.code === 11000;

export const buildJobRunKey = ({
  at = new Date(),
  intervalMs = 60 * 1000,
} = {}) => {
  const timestamp = new Date(at).getTime();
  const slot = Math.floor(timestamp / Math.max(intervalMs, 1000));
  return String(slot);
};

export const buildJobRequestContext = ({
  correlationId,
  requestId = null,
} = {}) => ({
  actorId: null,
  role: "system",
  requestId: requestId || correlationId,
});

export const runIdempotentJob = async ({
  jobName,
  runKey,
  requestId = null,
  metadata = {},
  handler,
}) => {
  const correlationId = requestId || `job-${jobName}-${randomUUID()}`;
  const startedAt = new Date();
  const existing = await jobsRepository.findByJobAndRunKey(jobName, runKey);

  if (existing) {
    jobsLogger.info(
      {
        jobName,
        runKey,
        correlationId,
        existingExecutionId: existing.id,
        existingStatus: existing.status,
      },
      "Job run skipped because run key already exists",
    );

    return {
      skipped: true,
      duplicate: true,
      correlationId,
      runKey,
      execution: existing,
    };
  }

  let execution;

  try {
    execution = await jobsRepository.createExecution({
      jobName,
      runKey,
      correlationId,
      requestId: requestId || correlationId,
      status: JOB_EXECUTION_STATUSES.RUNNING,
      startedAt,
      metadata,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const duplicate = await jobsRepository.findByJobAndRunKey(
        jobName,
        runKey,
      );

      return {
        skipped: true,
        duplicate: true,
        correlationId,
        runKey,
        execution: duplicate,
      };
    }

    throw error;
  }

  jobsLogger.info(
    {
      jobName,
      runKey,
      correlationId,
      executionId: execution.id,
    },
    "Job run started",
  );

  try {
    const result = await handler({
      correlationId,
      runKey,
      executionId: execution.id,
      requestContext: buildJobRequestContext({
        correlationId,
        requestId,
      }),
    });
    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();
    const updated = await jobsRepository.updateExecutionById(execution.id, {
      status: JOB_EXECUTION_STATUSES.SUCCEEDED,
      finishedAt,
      durationMs,
      result: result || {},
      errorMessage: "",
    });

    jobsLogger.info(
      {
        jobName,
        runKey,
        correlationId,
        executionId: execution.id,
        durationMs,
      },
      "Job run completed",
    );

    return {
      skipped: false,
      duplicate: false,
      correlationId,
      runKey,
      execution: updated,
      result: result || {},
    };
  } catch (error) {
    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();

    await jobsRepository.updateExecutionById(execution.id, {
      status: JOB_EXECUTION_STATUSES.FAILED,
      finishedAt,
      durationMs,
      errorMessage: error.message,
      result: {
        failedAt: finishedAt.toISOString(),
      },
    });

    jobsLogger.error(
      {
        jobName,
        runKey,
        correlationId,
        executionId: execution.id,
        durationMs,
        error: error.message,
      },
      "Job run failed",
    );

    throw error;
  }
};
