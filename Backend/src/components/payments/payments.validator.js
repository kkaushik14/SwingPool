import { z } from "zod";

const metadataValueSchema = z.union([z.string(), z.number(), z.boolean()]);

export const createPaymentIntentSchema = z.object({
  body: z.object({
    amount: z.number().int().positive(),
    currency: z.string().trim().min(3).max(3).optional(),
    description: z.string().trim().max(180).optional(),
    sourceDomain: z.string().trim().max(80).optional(),
    sourceEntityId: z.string().trim().max(120).optional(),
    sourceAction: z.string().trim().max(80).optional(),
    metadata: z.record(z.string(), metadataValueSchema).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const createCheckoutSessionSchema = z.object({
  body: z.object({
    amount: z.number().int().positive(),
    currency: z.string().trim().min(3).max(3).optional(),
    description: z.string().trim().max(180).optional(),
    successUrl: z.string().trim().url(),
    cancelUrl: z.string().trim().url(),
    sourceDomain: z.string().trim().max(80).optional(),
    sourceEntityId: z.string().trim().max(120).optional(),
    sourceAction: z.string().trim().max(80).optional(),
    metadata: z.record(z.string(), metadataValueSchema).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const processTimeoutsSchema = z.object({
  body: z.object({
    runAt: z.coerce.date().optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});
