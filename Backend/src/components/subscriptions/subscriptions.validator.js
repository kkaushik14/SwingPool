import { z } from "zod";

import { objectIdSchema } from "../../validators/index.js";

import {
  COUPON_DISCOUNT_TYPES,
  SUBSCRIPTION_HISTORY_EVENT_TYPES,
  SUBSCRIPTION_PLAN_CODES,
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_UPGRADE_PATHS,
} from "./subscriptions.enums.js";

const planCodeSchema = z.string().trim().toLowerCase().min(2).max(50);

const subscriptionIdParams = z.object({
  subscriptionId: objectIdSchema,
});

const planIdParams = z.object({
  planId: objectIdSchema,
});

const couponIdParams = z.object({
  couponId: objectIdSchema,
});

const commonEnvelope = {
  query: z.object({}).default({}),
};

export const createSubscriptionSchema = z.object({
  body: z.object({
    planCode: planCodeSchema,
    couponCode: z.string().trim().toUpperCase().max(60).optional(),
    charityId: objectIdSchema.optional(),
    optionalDonationInr: z.number().min(0).optional(),
    metadata: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional(),
  }),
  params: z.object({}).default({}),
  ...commonEnvelope,
});

export const confirmSubscriptionPaymentSchema = z.object({
  body: z.object({
    paymentIntentId: z.string().trim().min(5),
    paymentConfirmed: z.boolean().optional(),
    paymentReference: z.string().trim().max(160).optional(),
  }),
  params: subscriptionIdParams,
  ...commonEnvelope,
});

export const cancelSubscriptionSchema = z.object({
  body: z.object({
    reason: z.string().trim().max(300).optional(),
  }),
  params: subscriptionIdParams,
  ...commonEnvelope,
});

export const upgradePreviewSchema = z.object({
  body: z.object({
    targetPlanCode: planCodeSchema,
  }),
  params: subscriptionIdParams,
  ...commonEnvelope,
});

export const upgradeSubscriptionSchema = z.object({
  body: z.object({
    targetPlanCode: planCodeSchema,
    paymentConfirmed: z.boolean(),
    paymentReference: z.string().trim().max(160).optional(),
  }),
  params: subscriptionIdParams,
  ...commonEnvelope,
});

export const createPlanSchema = z.object({
  body: z.object({
    code: planCodeSchema,
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(260).optional(),
    priceInr: z.number().nonnegative(),
    billingCycleDays: z.number().int().positive(),
    hierarchyLevel: z.number().int().positive(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
    metadata: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional(),
  }),
  params: z.object({}).default({}),
  ...commonEnvelope,
});

export const updatePlanSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(260).optional(),
    priceInr: z.number().nonnegative().optional(),
    billingCycleDays: z.number().int().positive().optional(),
    hierarchyLevel: z.number().int().positive().optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
    metadata: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional(),
  }),
  params: planIdParams,
  ...commonEnvelope,
});

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().trim().toUpperCase().min(3).max(60),
    description: z.string().trim().max(260).optional(),
    discountType: z.enum([
      COUPON_DISCOUNT_TYPES.PERCENTAGE,
      COUPON_DISCOUNT_TYPES.FLAT,
    ]),
    discountValue: z.number().positive(),
    maxDiscountInr: z.number().positive().optional(),
    minOrderAmountInr: z.number().nonnegative().optional(),
    maxRedemptions: z.number().int().positive().optional(),
    validFrom: z.coerce.date().optional(),
    validTo: z.coerce.date().optional(),
    applicablePlanCodes: z.array(planCodeSchema).optional(),
    isActive: z.boolean().optional(),
    metadata: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional(),
  }),
  params: z.object({}).default({}),
  ...commonEnvelope,
});

export const updateCouponSchema = z.object({
  body: z.object({
    description: z.string().trim().max(260).optional(),
    discountType: z
      .enum([COUPON_DISCOUNT_TYPES.PERCENTAGE, COUPON_DISCOUNT_TYPES.FLAT])
      .optional(),
    discountValue: z.number().positive().optional(),
    maxDiscountInr: z.number().positive().nullable().optional(),
    minOrderAmountInr: z.number().nonnegative().optional(),
    maxRedemptions: z.number().int().positive().nullable().optional(),
    validFrom: z.coerce.date().nullable().optional(),
    validTo: z.coerce.date().nullable().optional(),
    applicablePlanCodes: z.array(planCodeSchema).optional(),
    isActive: z.boolean().optional(),
    metadata: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional(),
  }),
  params: couponIdParams,
  ...commonEnvelope,
});

export const updateSubscriptionConfigSchema = z.object({
  body: z.object({
    gracePeriodDays: z.number().int().positive().optional(),
    mandatoryCharityPercentage: z.number().min(0).max(100).optional(),
    metadata: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional(),
  }),
  params: z.object({}).default({}),
  ...commonEnvelope,
});

export const renewalFailedSchema = z.object({
  body: z.object({
    reason: z.string().trim().max(260).optional(),
  }),
  params: subscriptionIdParams,
  ...commonEnvelope,
});

export const processGraceExpirySchema = z.object({
  body: z.object({
    runAt: z.coerce.date().optional(),
  }),
  params: z.object({}).default({}),
  ...commonEnvelope,
});

export const subscriptionHistoryQuerySchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z
    .object({
      eventType: z
        .enum(Object.values(SUBSCRIPTION_HISTORY_EVENT_TYPES))
        .optional(),
      status: z.enum(Object.values(SUBSCRIPTION_STATUSES)).optional(),
    })
    .default({}),
});
