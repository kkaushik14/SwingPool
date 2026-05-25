import { z } from "zod";

import { objectIdSchema } from "../../validators/index.js";

import {
  CHARITIES_STATUSES,
  CHARITY_CURRENCIES,
  CHARITY_PAYOUT_ENTRY_TYPES,
  CHARITY_PAYOUT_STATUSES,
} from "./charities.enums.js";

const metadataValueSchema = z.union([z.string(), z.number(), z.boolean()]);

const commonEnvelope = {
  query: z.object({}).default({}),
};

export const createCharitySchema = z.object({
  body: z.object({
    code: z.string().trim().toLowerCase().min(2).max(60),
    name: z.string().trim().min(2).max(120),
    mission: z.string().trim().min(10).max(500),
    website: z.string().trim().url().optional(),
    currency: z.enum([CHARITY_CURRENCIES.INR]).optional(),
    supportedCurrencies: z.array(z.enum([CHARITY_CURRENCIES.INR])).optional(),
    isFeatured: z.boolean().optional(),
    status: z
      .enum([
        CHARITIES_STATUSES.ACTIVE,
        CHARITIES_STATUSES.INACTIVE,
        CHARITIES_STATUSES.ARCHIVED,
      ])
      .optional(),
    metadata: z.record(z.string(), metadataValueSchema).optional(),
  }),
  params: z.object({}).default({}),
  ...commonEnvelope,
});

export const updateCharitySchema = z.object({
  body: z.object({
    code: z.string().trim().toLowerCase().min(2).max(60).optional(),
    name: z.string().trim().min(2).max(120).optional(),
    mission: z.string().trim().min(10).max(500).optional(),
    website: z.string().trim().url().optional(),
    currency: z.enum([CHARITY_CURRENCIES.INR]).optional(),
    supportedCurrencies: z.array(z.enum([CHARITY_CURRENCIES.INR])).optional(),
    isFeatured: z.boolean().optional(),
    status: z
      .enum([
        CHARITIES_STATUSES.ACTIVE,
        CHARITIES_STATUSES.INACTIVE,
        CHARITIES_STATUSES.ARCHIVED,
      ])
      .optional(),
    metadata: z.record(z.string(), metadataValueSchema).optional(),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
  ...commonEnvelope,
});

export const charitiesIdParamsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    id: objectIdSchema,
  }),
  ...commonEnvelope,
});

export const setMyCharitySelectionSchema = z.object({
  body: z.object({
    charityId: objectIdSchema,
    reason: z.string().trim().max(240).optional(),
    metadata: z.record(z.string(), metadataValueSchema).optional(),
  }),
  params: z.object({}).default({}),
  ...commonEnvelope,
});

export const createDonationIntentSchema = z.object({
  body: z.object({
    charityId: objectIdSchema,
    amountInr: z.number().positive(),
    message: z.string().trim().max(240).optional(),
    metadata: z.record(z.string(), metadataValueSchema).optional(),
  }),
  params: z.object({}).default({}),
  ...commonEnvelope,
});

export const updateContributionRuleSchema = z.object({
  body: z.object({
    gatewayFeePercentage: z.number().min(0).max(100).optional(),
    prizePoolPercentage: z.number().min(0).max(100).optional(),
    mandatoryCharityPercentage: z.number().min(0).max(100).optional(),
    metadata: z.record(z.string(), metadataValueSchema).optional(),
  }),
  params: z.object({}).default({}),
  ...commonEnvelope,
});

export const createPayoutEntrySchema = z.object({
  body: z.object({
    charityId: objectIdSchema,
    entryType: z.enum([
      CHARITY_PAYOUT_ENTRY_TYPES.PAYOUT,
      CHARITY_PAYOUT_ENTRY_TYPES.ADJUSTMENT_CREDIT,
      CHARITY_PAYOUT_ENTRY_TYPES.ADJUSTMENT_DEBIT,
    ]),
    amountInr: z.number().positive(),
    externalReference: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(500).optional(),
    metadata: z.record(z.string(), metadataValueSchema).optional(),
  }),
  params: z.object({}).default({}),
  ...commonEnvelope,
});

export const payoutIdParamsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    payoutId: objectIdSchema,
  }),
  ...commonEnvelope,
});

export const updatePayoutEntrySchema = z.object({
  body: z.object({
    status: z.enum([
      CHARITY_PAYOUT_STATUSES.PENDING,
      CHARITY_PAYOUT_STATUSES.COMPLETED,
      CHARITY_PAYOUT_STATUSES.CANCELLED,
    ]),
    externalReference: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(500).optional(),
    metadata: z.record(z.string(), metadataValueSchema).optional(),
  }),
  params: z.object({
    payoutId: objectIdSchema,
  }),
  ...commonEnvelope,
});

export const reportsQuerySchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z
    .object({
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
      charityId: objectIdSchema.optional(),
    })
    .default({}),
});
