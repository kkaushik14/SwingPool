import { z } from "zod";

import { objectIdSchema } from "../../validators/index.js";

import {
  WINNER_PAYOUT_STATUSES,
  WINNER_PROOF_SUBMISSION_STATUSES,
} from "./winners.enums.js";

const proofFileSchema = z.object({
  fileUrl: z.string().trim().url(),
  fileName: z.string().trim().min(1).max(240),
  fileType: z.string().trim().max(120).optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
});

const metadataValueSchema = z.union([z.string(), z.number(), z.boolean()]);

export const winnersIdParamsSchema = z.object({
  body: z.object({}).default({}),
  query: z.object({}).default({}),
  params: z.object({
    id: objectIdSchema,
  }),
});

export const winnerIdParamsSchema = z.object({
  body: z.object({}).default({}),
  query: z.object({}).default({}),
  params: z.object({
    winnerId: objectIdSchema,
  }),
});

export const submitWinnerProofSchema = z.object({
  body: z.object({
    files: z.array(proofFileSchema).min(1).max(2),
    metadata: z.record(z.string(), metadataValueSchema).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({
    winnerId: objectIdSchema,
  }),
});

export const reviewWinnerProofSchema = z.object({
  body: z
    .object({
      status: z.enum([
        WINNER_PROOF_SUBMISSION_STATUSES.APPROVED,
        WINNER_PROOF_SUBMISSION_STATUSES.REJECTED,
      ]),
      rejectionReason: z.string().trim().max(500).optional(),
      metadata: z.record(z.string(), metadataValueSchema).optional(),
    })
    .superRefine((value, ctx) => {
      if (
        value.status === WINNER_PROOF_SUBMISSION_STATUSES.REJECTED &&
        !value.rejectionReason?.trim()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "rejectionReason is required when proof submission is rejected.",
          path: ["rejectionReason"],
        });
      }
    }),
  query: z.object({}).default({}),
  params: z.object({
    winnerId: objectIdSchema,
    proofId: objectIdSchema,
  }),
});

export const updateWinnerPayoutSchema = z.object({
  body: z
    .object({
      payoutStatus: z.enum([
        WINNER_PAYOUT_STATUSES.APPROVED,
        WINNER_PAYOUT_STATUSES.REJECTED,
        WINNER_PAYOUT_STATUSES.PAYOUT_PENDING,
        WINNER_PAYOUT_STATUSES.PAID,
      ]),
      rejectionReason: z.string().trim().max(500).optional(),
      payoutReference: z.string().trim().max(240).optional(),
      metadata: z.record(z.string(), metadataValueSchema).optional(),
    })
    .superRefine((value, ctx) => {
      if (
        value.payoutStatus === WINNER_PAYOUT_STATUSES.REJECTED &&
        !value.rejectionReason?.trim()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "rejectionReason is required when payout status is rejected.",
          path: ["rejectionReason"],
        });
      }
    }),
  query: z.object({}).default({}),
  params: z.object({
    winnerId: objectIdSchema,
  }),
});

export const listWinnersAdminQuerySchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z
    .object({
      drawId: objectIdSchema.optional(),
      userId: objectIdSchema.optional(),
      payoutStatus: z
        .enum([
          WINNER_PAYOUT_STATUSES.PENDING_VERIFICATION,
          WINNER_PAYOUT_STATUSES.APPROVED,
          WINNER_PAYOUT_STATUSES.REJECTED,
          WINNER_PAYOUT_STATUSES.PAYOUT_PENDING,
          WINNER_PAYOUT_STATUSES.PAID,
        ])
        .optional(),
    })
    .default({}),
});

export const createWinnerSchema = z.object({
  body: z.object({
    drawId: objectIdSchema,
    publishedResultId: objectIdSchema,
    entryId: objectIdSchema,
    userId: objectIdSchema,
    matchCount: z.number().int().min(3).max(5),
    contestNumbers: z.array(z.number().int().min(1).max(45)).min(5).max(5),
    matchedNumbers: z.array(z.number().int().min(1).max(45)).min(3).max(5),
    prizeAmountMinor: z.number().int().nonnegative(),
    verificationDeadlineAt: z.coerce.date(),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});
