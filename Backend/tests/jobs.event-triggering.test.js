import { describe, expect, it, vi } from "vitest";

import { notificationsService } from "../src/components/notifications/notifications.service.js";
import { NOTIFICATION_EVENT_TYPES } from "../src/components/notifications/notifications.enums.js";
import { subscriptionsRepository } from "../src/components/subscriptions/subscriptions.repository.js";
import { runRenewalReminderJob } from "../src/jobs/renewal-reminder.job.js";
import { jobsRepository } from "../src/jobs/jobs.repository.js";

describe("Jobs Event Triggering", () => {
  it("triggers renewal reminder notification events for due subscriptions", async () => {
    vi.spyOn(jobsRepository, "findByJobAndRunKey").mockResolvedValue(null);
    vi.spyOn(jobsRepository, "createExecution").mockResolvedValue({
      id: "job-execution-1",
      status: "running",
    });
    vi.spyOn(jobsRepository, "updateExecutionById").mockResolvedValue({
      id: "job-execution-1",
      status: "succeeded",
    });
    vi.spyOn(
      subscriptionsRepository,
      "findRenewalReminderCandidates",
    ).mockResolvedValue([
      {
        id: "subscription-1",
        userId: "507f1f77bcf86cd799439011",
        planNameSnapshot: "Monthly",
        nextBillingAt: new Date("2026-05-01T00:00:00.000Z"),
      },
    ]);

    const notifySpy = vi
      .spyOn(notificationsService, "dispatchEvent")
      .mockResolvedValue({
        dispatched: true,
      });

    const result = await runRenewalReminderJob({
      at: new Date("2026-04-28T00:00:00.000Z"),
      runKey: "renewal-job-1",
      requestId: "req-renewal-job-1",
    });

    expect(result.skipped).toBe(false);
    expect(notifySpy).toHaveBeenCalledTimes(1);
    expect(notifySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: NOTIFICATION_EVENT_TYPES.RENEWAL_REMINDER,
      }),
    );
  });
});
