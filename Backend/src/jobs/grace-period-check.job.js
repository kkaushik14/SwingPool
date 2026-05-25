import { config } from "../config/index.js";
import { DAY_IN_MS } from "../constants/index.js";
import { NOTIFICATION_EVENT_TYPES } from "../components/notifications/notifications.enums.js";
import { notificationsService } from "../components/notifications/notifications.service.js";
import { subscriptionsRepository } from "../components/subscriptions/subscriptions.repository.js";

import { buildJobRunKey, runIdempotentJob } from "./job-runner.js";
import { JOB_NAMES } from "./jobs.enums.js";

export const runGracePeriodCheckJob = async ({
  at = new Date(),
  requestId = null,
  runKey = buildJobRunKey({
    at,
    intervalMs: config.jobs.gracePeriodCheckIntervalMs,
  }),
} = {}) => {
  return runIdempotentJob({
    jobName: JOB_NAMES.GRACE_PERIOD_CHECK,
    runKey,
    requestId,
    metadata: {
      at,
      warningLeadDays: config.jobs.graceWarningLeadDays,
    },
    handler: async ({ requestContext }) => {
      const windowStart = new Date(at);
      const windowEnd = new Date(
        windowStart.getTime() + config.jobs.graceWarningLeadDays * DAY_IN_MS,
      );
      const candidates =
        await subscriptionsRepository.findGracePeriodWarningCandidates({
          from: windowStart,
          to: windowEnd,
        });

      let dispatchedCount = 0;
      let skippedCount = 0;

      for (const subscription of candidates) {
        const graceEndIso = subscription.gracePeriodEndsAt
          ? new Date(subscription.gracePeriodEndsAt).toISOString().slice(0, 10)
          : "na";

        const result = await notificationsService.dispatchEvent({
          userId: subscription.userId,
          eventType: NOTIFICATION_EVENT_TYPES.GRACE_PERIOD_WARNING,
          context: {
            subscriptionId: subscription.id,
            gracePeriodEndsAt: subscription.gracePeriodEndsAt,
          },
          dedupeKey: `subscription:${subscription.id}:grace_warning:${graceEndIso}`,
          requestContext,
        });

        if (result.dispatched) {
          dispatchedCount += 1;
        } else {
          skippedCount += 1;
        }
      }

      return {
        processedCount: candidates.length,
        dispatchedCount,
        skippedCount,
        windowStart,
        windowEnd,
      };
    },
  });
};
