import { config } from "../config/index.js";
import { DAY_IN_MS } from "../constants/index.js";
import { NOTIFICATION_EVENT_TYPES } from "../components/notifications/notifications.enums.js";
import { notificationsService } from "../components/notifications/notifications.service.js";
import { subscriptionsRepository } from "../components/subscriptions/subscriptions.repository.js";

import { buildJobRunKey, runIdempotentJob } from "./job-runner.js";
import { JOB_NAMES } from "./jobs.enums.js";

export const runRenewalReminderJob = async ({
  at = new Date(),
  requestId = null,
  runKey = buildJobRunKey({
    at,
    intervalMs: config.jobs.renewalReminderIntervalMs,
  }),
} = {}) => {
  return runIdempotentJob({
    jobName: JOB_NAMES.RENEWAL_REMINDER,
    runKey,
    requestId,
    metadata: {
      at,
      reminderLeadDays: config.jobs.renewalReminderLeadDays,
    },
    handler: async ({ requestContext }) => {
      const windowStart = new Date(at);
      const windowEnd = new Date(
        windowStart.getTime() + config.jobs.renewalReminderLeadDays * DAY_IN_MS,
      );
      const candidates =
        await subscriptionsRepository.findRenewalReminderCandidates({
          from: windowStart,
          to: windowEnd,
        });

      let dispatchedCount = 0;
      let skippedCount = 0;

      for (const subscription of candidates) {
        const nextBillingAtIso = subscription.nextBillingAt
          ? new Date(subscription.nextBillingAt).toISOString().slice(0, 10)
          : "na";

        const result = await notificationsService.dispatchEvent({
          userId: subscription.userId,
          eventType: NOTIFICATION_EVENT_TYPES.RENEWAL_REMINDER,
          context: {
            subscriptionId: subscription.id,
            planName: subscription.planNameSnapshot,
            nextBillingAt: subscription.nextBillingAt,
          },
          dedupeKey: `subscription:${subscription.id}:renewal:${nextBillingAtIso}`,
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
