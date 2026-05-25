import { describe, expect, it, vi } from "vitest";

import { JOB_EXECUTION_STATUSES } from "../src/jobs/jobs.enums.js";
import { runIdempotentJob } from "../src/jobs/job-runner.js";
import { jobsRepository } from "../src/jobs/jobs.repository.js";

describe("Job Runner Idempotency", () => {
  it("runs once for a runKey and skips duplicate runs", async () => {
    const jobName = "renewal_reminder";
    const runKey = "12345";
    const execution = {
      id: "execution-1",
      jobName,
      runKey,
      status: JOB_EXECUTION_STATUSES.RUNNING,
    };

    const findSpy = vi
      .spyOn(jobsRepository, "findByJobAndRunKey")
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        ...execution,
        status: JOB_EXECUTION_STATUSES.SUCCEEDED,
      });
    vi.spyOn(jobsRepository, "createExecution").mockResolvedValue(execution);
    vi.spyOn(jobsRepository, "updateExecutionById").mockResolvedValue({
      ...execution,
      status: JOB_EXECUTION_STATUSES.SUCCEEDED,
    });

    const handler = vi.fn().mockResolvedValue({
      processedCount: 1,
    });

    const first = await runIdempotentJob({
      jobName,
      runKey,
      handler,
    });
    const second = await runIdempotentJob({
      jobName,
      runKey,
      handler,
    });

    expect(first.skipped).toBe(false);
    expect(second.skipped).toBe(true);
    expect(second.duplicate).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(findSpy).toHaveBeenCalledTimes(2);
  });
});
