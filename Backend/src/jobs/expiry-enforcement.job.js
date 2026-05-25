import { config } from "../config/index.js";
import { subscriptionsService } from "../components/subscriptions/subscriptions.service.js";

import { buildJobRunKey, runIdempotentJob } from "./job-runner.js";
import { JOB_NAMES } from "./jobs.enums.js";

export const runExpiryEnforcementJob = async ({
  at = new Date(),
  requestId = null,
  runKey = buildJobRunKey({
    at,
    intervalMs: config.jobs.expiryEnforcementIntervalMs,
  }),
} = {}) => {
  return runIdempotentJob({
    jobName: JOB_NAMES.EXPIRY_ENFORCEMENT,
    runKey,
    requestId,
    metadata: {
      at,
    },
    handler: async ({ requestContext }) => {
      const result = await subscriptionsService.processGracePeriodExpirations(
        at,
        requestContext,
      );

      return {
        processedAt: result.processedAt,
        expiredCount: result.expiredCount,
      };
    },
  });
};
