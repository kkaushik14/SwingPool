import { config } from "../config/index.js";
import { paymentsRepository } from "../components/payments/payments.repository.js";
import { paymentsService } from "../components/payments/payments.service.js";

import { buildJobRunKey, runIdempotentJob } from "./job-runner.js";
import { JOB_NAMES } from "./jobs.enums.js";

const MINUTE_MS = 60 * 1000;

export const runPaymentReconciliationJob = async ({
  at = new Date(),
  requestId = null,
  runKey = buildJobRunKey({
    at,
    intervalMs: config.jobs.paymentReconciliationIntervalMs,
  }),
} = {}) => {
  return runIdempotentJob({
    jobName: JOB_NAMES.PAYMENT_RECONCILIATION,
    runKey,
    requestId,
    metadata: {
      at,
      lookbackMinutes: config.jobs.paymentReconciliationLookbackMinutes,
      batchSize: config.jobs.paymentReconciliationBatchSize,
    },
    handler: async ({ requestContext }) => {
      const timeouts = await paymentsService.processTimedOutPayments(
        at,
        requestContext,
      );
      const updatedBefore = new Date(
        at.getTime() -
          config.jobs.paymentReconciliationLookbackMinutes * MINUTE_MS,
      );
      const candidates = await paymentsRepository.findReconciliationCandidates({
        updatedBefore,
        limit: config.jobs.paymentReconciliationBatchSize,
      });

      let reconciledCount = 0;
      let failedCount = 0;
      const failures = [];

      for (const payment of candidates) {
        try {
          await paymentsService.reconcilePaymentIntentWithStripe(
            payment.stripePaymentIntentId,
            requestContext,
          );
          reconciledCount += 1;
        } catch (error) {
          failedCount += 1;
          failures.push({
            paymentId: payment.id,
            paymentIntentId: payment.stripePaymentIntentId,
            error: error.message,
          });
        }
      }

      return {
        timeoutProcessedCount: timeouts.processedCount,
        candidateCount: candidates.length,
        reconciledCount,
        failedCount,
        failures,
      };
    },
  });
};
