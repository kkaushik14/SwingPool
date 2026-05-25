import { describe, expect, it, vi } from "vitest";

import { drawsRepository } from "../src/components/draws/draws.repository.js";
import {
  WINNER_PAYOUT_STATUSES,
  WINNER_PROOF_SUBMISSION_STATUSES,
} from "../src/components/winners/winners.enums.js";
import { winnersRepository } from "../src/components/winners/winners.repository.js";
import { winnersService } from "../src/components/winners/winners.service.js";

const WINNER_ID = "507f1f77bcf86cd799439771";
const USER_ID = "507f1f77bcf86cd799439011";

const buildWinner = (overrides = {}) => ({
  id: WINNER_ID,
  _id: WINNER_ID,
  drawId: "507f1f77bcf86cd799439221",
  publishedResultId: "507f1f77bcf86cd799439311",
  entryId: "507f1f77bcf86cd799439401",
  userId: USER_ID,
  matchCount: 4,
  contestNumbers: [1, 2, 3, 4, 6],
  matchedNumbers: [1, 2, 3, 4],
  prizeAmountMinor: 3000,
  prizeAmountMajor: "30.00",
  payoutStatus: WINNER_PAYOUT_STATUSES.PENDING_VERIFICATION,
  verificationDeadlineAt: new Date("2026-05-23T00:00:00.000Z"),
  approvedAt: null,
  rejectedAt: null,
  rejectionReason: "",
  payoutPendingAt: null,
  paidAt: null,
  payoutReference: "",
  latestProofSubmissionId: null,
  proofSubmissionCount: 0,
  metadata: {},
  createdAt: new Date("2026-04-30T18:00:00.000Z"),
  updatedAt: new Date("2026-04-30T18:00:00.000Z"),
  ...overrides,
});

describe("Winners Service", () => {
  it("blocks proof submission after deadline", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-24T00:00:00.000Z"));

    vi.spyOn(winnersRepository, "findById").mockResolvedValue(
      buildWinner({
        verificationDeadlineAt: new Date("2026-05-23T00:00:00.000Z"),
      }),
    );

    await expect(
      winnersService.submitProof({
        winnerId: WINNER_ID,
        requesterUserId: USER_ID,
        requesterRole: "user",
        payload: {
          files: [
            {
              fileUrl: "https://example.com/proof-a.jpg",
              fileName: "proof-a.jpg",
            },
          ],
        },
      }),
    ).rejects.toThrow("window is closed");

    vi.useRealTimers();
  });

  it("allows rejected winner resubmission within deadline", async () => {
    vi.spyOn(winnersRepository, "findById").mockResolvedValue(
      buildWinner({
        payoutStatus: WINNER_PAYOUT_STATUSES.REJECTED,
        rejectedAt: new Date("2026-05-05T00:00:00.000Z"),
        rejectionReason: "Blurry document",
        proofSubmissionCount: 1,
      }),
    );
    vi.spyOn(drawsRepository, "getConfig").mockResolvedValue({
      maxProofFiles: 2,
    });
    vi.spyOn(
      winnersRepository,
      "findLatestProofSubmissionForWinner",
    ).mockResolvedValue({
      id: "proof-prev",
      submissionNumber: 1,
      status: WINNER_PROOF_SUBMISSION_STATUSES.REJECTED,
    });
    vi.spyOn(winnersRepository, "createProofSubmission").mockResolvedValue({
      id: "proof-new",
      winnerId: WINNER_ID,
      drawId: "507f1f77bcf86cd799439221",
      userId: USER_ID,
      submissionNumber: 2,
      files: [
        {
          fileUrl: "https://example.com/proof-b.jpg",
          fileName: "proof-b.jpg",
        },
      ],
      status: WINNER_PROOF_SUBMISSION_STATUSES.SUBMITTED,
      submittedAt: new Date("2026-05-10T00:00:00.000Z"),
      metadata: {},
      createdAt: new Date("2026-05-10T00:00:00.000Z"),
      updatedAt: new Date("2026-05-10T00:00:00.000Z"),
    });
    const updateSpy = vi
      .spyOn(winnersRepository, "updateById")
      .mockResolvedValue(buildWinner());

    const created = await winnersService.submitProof({
      winnerId: WINNER_ID,
      requesterUserId: USER_ID,
      requesterRole: "user",
      payload: {
        files: [
          {
            fileUrl: "https://example.com/proof-b.jpg",
            fileName: "proof-b.jpg",
          },
        ],
      },
    });

    expect(created.submissionNumber).toBe(2);
    expect(updateSpy).toHaveBeenCalledWith(
      WINNER_ID,
      expect.objectContaining({
        payoutStatus: WINNER_PAYOUT_STATUSES.PENDING_VERIFICATION,
      }),
    );
  });
});
