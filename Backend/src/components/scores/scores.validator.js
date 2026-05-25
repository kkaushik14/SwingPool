import { z } from "zod";
import {
  objectIdSchema,
  paginationQuerySchema,
} from "../../validators/index.js";

import { SCORES_STATUSES } from "./scores.enums.js";

const metadataValueSchema = z.union([z.string(), z.number(), z.boolean()]);

const sortOrderSchema = z.enum(["asc", "desc"]);

const queryBooleanSchema = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true;
    }

    if (value.toLowerCase() === "false") {
      return false;
    }
  }

  return value;
}, z.boolean());

export const createScoreSchema = z.object({
  body: z.object({
    playedDate: z.coerce.date(),
    value: z.number().int().min(1).max(45),
    contestNumber: z.number().int().positive(),
    metadata: z.record(z.string(), metadataValueSchema).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const listScoreHistoryQuerySchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: paginationQuerySchema
    .extend({
      status: z
        .enum([
          SCORES_STATUSES.ACTIVE,
          SCORES_STATUSES.INACTIVE,
          SCORES_STATUSES.ARCHIVED,
        ])
        .optional(),
      includeBackdated: queryBooleanSchema.optional(),
      contestNumber: z.coerce.number().int().positive().optional(),
      sortBy: z
        .enum([
          "submittedAt",
          "playedDate",
          "value",
          "contestNumber",
          "createdAt",
        ])
        .optional(),
      sortOrder: sortOrderSchema.optional(),
    })
    .default({}),
});

export const updateScoreByAdminSchema = z.object({
  body: z
    .object({
      playedDate: z.coerce.date().optional(),
      value: z.number().int().min(1).max(45).optional(),
      contestNumber: z.number().int().positive().optional(),
      status: z
        .enum([
          SCORES_STATUSES.ACTIVE,
          SCORES_STATUSES.INACTIVE,
          SCORES_STATUSES.ARCHIVED,
        ])
        .optional(),
      metadata: z.record(z.string(), metadataValueSchema).optional(),
      editReason: z.string().trim().min(3).max(500),
    })
    .refine(
      (payload) =>
        ["playedDate", "value", "contestNumber", "status", "metadata"].some(
          (field) => payload[field] !== undefined,
        ),
      {
        message: "At least one updatable field is required.",
      },
    ),
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({}).default({}),
});

export const scoresIdParamsSchema = z.object({
  body: z.object({}).default({}),
  query: z.object({}).default({}),
  params: z.object({
    id: objectIdSchema,
  }),
});
