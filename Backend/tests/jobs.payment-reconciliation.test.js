import { describe, expect, it, vi } from "vitest";

import { paymentsRepository } from "../src/components/payments/payments.repository.js";
import { paymentsService } from "../src/components/payments/payments.service.js";
import { runPaymentReconciliationJob } from "../src/jobs/payment-reconciliation.job.js";
import { jobsRepository } from "../src/jobs/jobs.repository.js";

describe("Payment Reconciliation Job", () => {
  it("processes reconciliation candidates and tracks failures safely", async () => {
    vi.spyOn(jobsRepository, "findByJobAndRunKey").mockResolvedValue(null);
    vi.spyOn(jobsRepository, "createExecution").mockResolvedValue({
      id: "job-execution-1",
      status: "running",
    });
    vi.spyOn(jobsRepository, "updateExecutionById").mockResolvedValue({
      id: "job-execution-1",
      status: "succeeded",
    });

    vi.spyOn(paymentsService, "processTimedOutPayments").mockResolvedValue({
      processedCount: 2,
      payments: [],
    });
    vi.spyOn(
      paymentsRepository,
      "findReconciliationCandidates",
    ).mockResolvedValue([
      {
        id: "payment-1",
        stripePaymentIntentId: "pi_success_1",
      },
      {
        id: "payment-2",
        stripePaymentIntentId: "pi_fail_2",
      },
    ]);

    const reconcileSpy = vi
      .spyOn(paymentsService, "reconcilePaymentIntentWithStripe")
      .mockResolvedValueOnce({
        processed: true,
      })
      .mockRejectedValueOnce(new Error("Stripe rate limit"));

    const result = await runPaymentReconciliationJob({
      at: new Date("2026-04-23T00:00:00.000Z"),
      runKey: "payment-recon-job-1",
      requestId: "req-payment-recon-1",
    });

    expect(result.skipped).toBe(false);
    expect(reconcileSpy).toHaveBeenCalledTimes(2);
    expect(result.result.timeoutProcessedCount).toBe(2);
    expect(result.result.candidateCount).toBe(2);
    expect(result.result.reconciledCount).toBe(1);
    expect(result.result.failedCount).toBe(1);
    expect(result.result.failures[0].paymentId).toBe("payment-2");
  });
});
