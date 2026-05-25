import { describe, expect, it, vi } from "vitest";

import { notificationsService } from "../src/components/notifications/notifications.service.js";
import { winnersRepository } from "../src/components/winners/winners.repository.js";
import { WINNER_PAYOUT_STATUSES } from "../src/components/winners/winners.enums.js";
import { winnersService } from "../src/components/winners/winners.service.js";

describe("Winner Deadline Enforcement", () => {
  it("rejects overdue winners and emits proof rejected notifications", async () => {
    const runAt = new Date("2026-05-10T10:00:00.000Z");

    vi.spyOn(
      winnersRepository,
      "findProofDeadlineExceededCandidates",
    ).mockResolvedValue([
      {
        id: "winner-1",
        userId: "507f1f77bcf86cd799439011",
        payoutStatus: WINNER_PAYOUT_STATUSES.PENDING_VERIFICATION,
        verificationDeadlineAt: new Date("2026-05-09T00:00:00.000Z"),
        rejectionReason: "",
        metadata: {},
      },
      {
        id: "winner-2",
        userId: "507f1f77bcf86cd799439012",
        payoutStatus: WINNER_PAYOUT_STATUSES.REJECTED,
        verificationDeadlineAt: new Date("2026-05-08T00:00:00.000Z"),
        rejectionReason: "Already reviewed",
        metadata: {},
      },
    ]);
    vi.spyOn(winnersRepository, "updateById").mockResolvedValue({
      id: "winner-1",
      userId: "507f1f77bcf86cd799439011",
      payoutStatus: WINNER_PAYOUT_STATUSES.REJECTED,
      rejectedAt: runAt,
      rejectionReason: "Proof submission deadline exceeded.",
      metadata: {},
    });

    const notifySpy = vi
      .spyOn(notificationsService, "dispatchEvent")
      .mockResolvedValue({
        dispatched: true,
      });

    const result = await winnersService.enforceProofDeadlines(runAt, {
      requestId: "job-proof-deadline-1",
      role: "system",
    });

    expect(result.updatedCount).toBe(1);
    expect(result.winners[0].id).toBe("winner-1");
    expect(notifySpy).toHaveBeenCalledTimes(1);
    expect(notifySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "507f1f77bcf86cd799439011",
      }),
    );
  });
});
