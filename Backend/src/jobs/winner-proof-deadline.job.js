import { config } from "../config/index.js";
import { winnersService } from "../components/winners/winners.service.js";

import { buildJobRunKey, runIdempotentJob } from "./job-runner.js";
import { JOB_NAMES } from "./jobs.enums.js";

export const runWinnerProofDeadlineJob = async ({
  at = new Date(),
  requestId = null,
  runKey = buildJobRunKey({
    at,
    intervalMs: config.jobs.winnerProofCheckIntervalMs,
  }),
} = {}) => {
  return runIdempotentJob({
    jobName: JOB_NAMES.WINNER_PROOF_DEADLINE_CHECK,
    runKey,
    requestId,
    metadata: {
      at,
    },
    handler: async ({ requestContext }) => {
      const result = await winnersService.enforceProofDeadlines(
        at,
        requestContext,
      );

      return {
        processedAt: result.processedAt,
        updatedCount: result.updatedCount,
      };
    },
  });
};
