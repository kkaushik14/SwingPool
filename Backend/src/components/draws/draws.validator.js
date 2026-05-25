import { z } from "zod";

import { objectIdSchema } from "../../validators/index.js";

import {
  DRAW_MODES,
  DRAW_PRIZE_POOL_SNAPSHOT_STRATEGIES,
  DRAW_SNAPSHOT_STATUSES,
} from "./draws.enums.js";

const metadataValueSchema = z.union([z.string(), z.number(), z.boolean()]);

export const drawIdParamsSchema = z.object({
  body: z.object({}).default({}),
  query: z.object({}).default({}),
  params: z.object({
    id: objectIdSchema,
  }),
});

export const createDrawSnapshotSchema = z.object({
  body: z.object({
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2024),
    mode: z.enum([DRAW_MODES.RANDOM, DRAW_MODES.ALGORITHMIC]).optional(),
    drawAt: z.coerce.date().optional(),
    prizePoolSnapshotStrategy: z
      .enum([
        DRAW_PRIZE_POOL_SNAPSHOT_STRATEGIES.DRAW_DAY,
        DRAW_PRIZE_POOL_SNAPSHOT_STRATEGIES.MONTH_END,
      ])
      .optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const updateDrawSnapshotSchema = z.object({
  body: z.object({
    drawAt: z.coerce.date().optional(),
    eligibilityCutoffAt: z.coerce.date().optional(),
    prizePoolSnapshotAt: z.coerce.date().optional(),
    status: z
      .enum([
        DRAW_SNAPSHOT_STATUSES.DRAFT,
        DRAW_SNAPSHOT_STATUSES.ENTRIES_LOCKED,
        DRAW_SNAPSHOT_STATUSES.PUBLISHED,
        DRAW_SNAPSHOT_STATUSES.CANCELLED,
      ])
      .optional(),
    metadata: z.record(z.string(), metadataValueSchema).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({
    id: objectIdSchema,
  }),
});

export const updateDrawConfigSchema = z.object({
  body: z.object({
    mode: z.enum([DRAW_MODES.RANDOM, DRAW_MODES.ALGORITHMIC]).optional(),
    numberRangeMin: z.number().int().min(1).optional(),
    numberRangeMax: z.number().int().min(1).optional(),
    numbersPerDraw: z.number().int().min(1).max(10).optional(),
    eligibilityCutoffDaysBeforeMonthEnd: z
      .number()
      .int()
      .min(1)
      .max(15)
      .optional(),
    proofDeadlineDays: z.number().int().min(1).max(60).optional(),
    maxProofFiles: z.number().int().min(1).max(5).optional(),
    prizeDistribution: z
      .object({
        match3Percentage: z.number().min(0).max(100),
        match4Percentage: z.number().min(0).max(100),
        match5Percentage: z.number().min(0).max(100),
      })
      .optional(),
    algorithmOptions: z.record(z.string(), metadataValueSchema).optional(),
    metadata: z.record(z.string(), metadataValueSchema).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const runDrawSimulationSchema = z.object({
  body: z.object({
    notes: z.string().trim().max(500).optional(),
    metadata: z.record(z.string(), metadataValueSchema).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({
    id: objectIdSchema,
  }),
});

export const addManualJackpotFundSchema = z.object({
  body: z.object({
    amountInr: z.number().positive(),
    notes: z.string().trim().max(500).optional(),
    metadata: z.record(z.string(), metadataValueSchema).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});
