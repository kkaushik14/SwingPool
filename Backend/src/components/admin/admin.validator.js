import { z } from "zod";

import {
  PROFILE_VERIFICATION_STATUSES,
  SUBSCRIPTION_STATUSES as USER_SUBSCRIPTION_STATUSES,
  USER_ROLES,
  USER_STATUSES,
} from "../../enums/index.js";
import {
  objectIdSchema,
  paginationQuerySchema,
} from "../../validators/index.js";
import {
  CHARITIES_STATUSES,
  CHARITY_PAYOUT_ENTRY_TYPES,
  CHARITY_PAYOUT_STATUSES,
  DONATION_STATUSES,
} from "../charities/charities.enums.js";
import { DRAW_MODES, DRAW_SNAPSHOT_STATUSES } from "../draws/draws.enums.js";
import { PAYMENT_STATES } from "../payments/payments.enums.js";
import { SCORES_STATUSES } from "../scores/scores.enums.js";
import {
  COUPON_DISCOUNT_TYPES,
  SUBSCRIPTION_STATUSES,
} from "../subscriptions/subscriptions.enums.js";
import {
  WINNER_PAYOUT_STATUSES,
  WINNER_PROOF_SUBMISSION_STATUSES,
} from "../winners/winners.enums.js";
import {
  ADMIN_MANUAL_DONATION_FIELDS,
  ADMIN_MANUAL_PAYMENT_FIELDS,
  ADMIN_MANUAL_SUBSCRIPTION_FIELDS,
} from "./admin.enums.js";

const parseBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return value;
};

const booleanQuerySchema = z.preprocess(parseBoolean, z.boolean());

const sortableQuerySchema = z.object({
  sortBy: z.string().trim().min(1).max(80).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

const dateRangeQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

const reasonSchema = z.string().trim().min(5).max(500);

const emptyParams = z.object({}).default({});
const emptyBody = z.object({}).default({});

export const adminUserIdParamsSchema = z.object({
  params: z.object({ userId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z.object({}).default({}),
});

export const listUsersQuerySchema = z.object({
  params: emptyParams,
  body: emptyBody,
  query: paginationQuerySchema.merge(sortableQuerySchema).extend({
    role: z.enum([USER_ROLES.USER, USER_ROLES.ADMIN]).optional(),
    status: z
      .enum([
        USER_STATUSES.PENDING_VERIFICATION,
        USER_STATUSES.VERIFIED,
        USER_STATUSES.SUSPENDED,
        USER_STATUSES.INACTIVE,
      ])
      .optional(),
    subscriptionStatus: z
      .enum([
        USER_SUBSCRIPTION_STATUSES.FREE,
        USER_SUBSCRIPTION_STATUSES.ACTIVE,
        USER_SUBSCRIPTION_STATUSES.PAST_DUE,
        USER_SUBSCRIPTION_STATUSES.CANCELED,
      ])
      .optional(),
    verificationStatus: z
      .enum([
        PROFILE_VERIFICATION_STATUSES.PENDING_VERIFICATION,
        PROFILE_VERIFICATION_STATUSES.VERIFIED,
        PROFILE_VERIFICATION_STATUSES.REJECTED,
      ])
      .optional(),
    search: z.string().trim().min(1).max(120).optional(),
    emailVerified: booleanQuerySchema.optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({ userId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z.object({
    displayName: z.string().trim().min(2).max(120).optional(),
    status: z
      .enum([
        USER_STATUSES.PENDING_VERIFICATION,
        USER_STATUSES.VERIFIED,
        USER_STATUSES.SUSPENDED,
        USER_STATUSES.INACTIVE,
      ])
      .optional(),
    subscriptionStatus: z
      .enum([
        USER_SUBSCRIPTION_STATUSES.FREE,
        USER_SUBSCRIPTION_STATUSES.ACTIVE,
        USER_SUBSCRIPTION_STATUSES.PAST_DUE,
        USER_SUBSCRIPTION_STATUSES.CANCELED,
      ])
      .optional(),
    mustRotatePassword: z.boolean().optional(),
    reason: reasonSchema,
  }),
});

export const verifyUserProfileSchema = z.object({
  params: z.object({ userId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z.object({
    verificationStatus: z.enum([
      PROFILE_VERIFICATION_STATUSES.PENDING_VERIFICATION,
      PROFILE_VERIFICATION_STATUSES.VERIFIED,
      PROFILE_VERIFICATION_STATUSES.REJECTED,
    ]),
    verificationReason: z.string().trim().max(500).optional(),
    reason: reasonSchema,
  }),
});

export const listPlansQuerySchema = z.object({
  params: emptyParams,
  body: emptyBody,
  query: z.object({
    includeInactive: booleanQuerySchema.optional(),
  }),
});

export const createPlanSchema = z.object({
  params: emptyParams,
  query: z.object({}).default({}),
  body: z.object({
    code: z.string().trim().min(2).max(40),
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(500).optional(),
    priceInr: z.coerce.number().min(0),
    billingCycleDays: z.coerce.number().int().min(1),
    hierarchyLevel: z.coerce.number().int().min(1),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    reason: reasonSchema,
  }),
});

export const planIdParamsSchema = z.object({
  params: z.object({ planId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z.object({}).default({}),
});

export const updatePlanSchema = z.object({
  params: z.object({ planId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z.object({
    code: z.string().trim().min(2).max(40).optional(),
    name: z.string().trim().min(2).max(120).optional(),
    description: z.string().trim().max(500).optional(),
    priceInr: z.coerce.number().min(0).optional(),
    billingCycleDays: z.coerce.number().int().min(1).optional(),
    hierarchyLevel: z.coerce.number().int().min(1).optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    reason: reasonSchema,
  }),
});

export const listCouponsQuerySchema = z.object({
  params: emptyParams,
  body: emptyBody,
  query: z.object({
    includeInactive: booleanQuerySchema.optional(),
  }),
});

export const createCouponSchema = z.object({
  params: emptyParams,
  query: z.object({}).default({}),
  body: z.object({
    code: z.string().trim().min(2).max(40),
    description: z.string().trim().max(500).optional(),
    discountType: z.enum([
      COUPON_DISCOUNT_TYPES.PERCENTAGE,
      COUPON_DISCOUNT_TYPES.FLAT,
    ]),
    discountValue: z.coerce.number().min(0),
    maxDiscountInr: z.coerce.number().min(0).nullable().optional(),
    minOrderAmountInr: z.coerce.number().min(0).optional(),
    maxRedemptions: z.coerce.number().int().min(1).nullable().optional(),
    validFrom: z.coerce.date().nullable().optional(),
    validTo: z.coerce.date().nullable().optional(),
    applicablePlanCodes: z.array(z.string().trim().min(2).max(40)).optional(),
    isActive: z.boolean().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    reason: reasonSchema,
  }),
});

export const couponIdParamsSchema = z.object({
  params: z.object({ couponId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z.object({}).default({}),
});

export const updateCouponSchema = z.object({
  params: z.object({ couponId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z.object({
    description: z.string().trim().max(500).optional(),
    discountType: z
      .enum([COUPON_DISCOUNT_TYPES.PERCENTAGE, COUPON_DISCOUNT_TYPES.FLAT])
      .optional(),
    discountValue: z.coerce.number().min(0).optional(),
    maxDiscountInr: z.coerce.number().min(0).nullable().optional(),
    minOrderAmountInr: z.coerce.number().min(0).optional(),
    maxRedemptions: z.coerce.number().int().min(1).nullable().optional(),
    validFrom: z.coerce.date().nullable().optional(),
    validTo: z.coerce.date().nullable().optional(),
    applicablePlanCodes: z.array(z.string().trim().min(2).max(40)).optional(),
    isActive: z.boolean().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    reason: reasonSchema,
  }),
});

export const updateSubscriptionConfigSchema = z.object({
  params: emptyParams,
  query: z.object({}).default({}),
  body: z.object({
    gracePeriodDays: z.coerce.number().int().min(1).optional(),
    mandatoryCharityPercentage: z.coerce.number().min(0).max(100).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    reason: reasonSchema,
  }),
});

export const listSubscriptionsQuerySchema = z.object({
  params: emptyParams,
  body: emptyBody,
  query: paginationQuerySchema
    .merge(sortableQuerySchema)
    .merge(dateRangeQuerySchema)
    .extend({
      userId: objectIdSchema.optional(),
      planCode: z.string().trim().min(2).max(40).optional(),
      status: z
        .enum([
          SUBSCRIPTION_STATUSES.PENDING_PAYMENT,
          SUBSCRIPTION_STATUSES.ACTIVE,
          SUBSCRIPTION_STATUSES.CANCELED,
          SUBSCRIPTION_STATUSES.GRACE_PERIOD,
          SUBSCRIPTION_STATUSES.EXPIRED,
          SUBSCRIPTION_STATUSES.PAYMENT_FAILED,
        ])
        .optional(),
      autoRenew: booleanQuerySchema.optional(),
      charityId: objectIdSchema.optional(),
    }),
});

export const subscriptionIdParamsSchema = z.object({
  params: z.object({ subscriptionId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z.object({}).default({}),
});

export const cancelSubscriptionSchema = z.object({
  params: z.object({ subscriptionId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z.object({
    reason: reasonSchema,
  }),
});

export const renewalFailedSchema = z.object({
  params: z.object({ subscriptionId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z.object({
    reason: reasonSchema,
  }),
});

export const processGraceExpirySchema = z.object({
  params: emptyParams,
  query: z.object({}).default({}),
  body: z.object({
    runAt: z.coerce.date().optional(),
    reason: z.string().trim().min(5).max(500).optional(),
  }),
});

export const manualAdjustSubscriptionSchema = z.object({
  params: z.object({ subscriptionId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z
    .object({
      status: z
        .enum([
          SUBSCRIPTION_STATUSES.PENDING_PAYMENT,
          SUBSCRIPTION_STATUSES.ACTIVE,
          SUBSCRIPTION_STATUSES.CANCELED,
          SUBSCRIPTION_STATUSES.GRACE_PERIOD,
          SUBSCRIPTION_STATUSES.EXPIRED,
          SUBSCRIPTION_STATUSES.PAYMENT_FAILED,
        ])
        .optional(),
      autoRenew: z.boolean().optional(),
      startAt: z.coerce.date().nullable().optional(),
      endAt: z.coerce.date().nullable().optional(),
      nextBillingAt: z.coerce.date().nullable().optional(),
      gracePeriodEndsAt: z.coerce.date().nullable().optional(),
      canceledAt: z.coerce.date().nullable().optional(),
      lastPaymentStatus: z.string().trim().max(120).optional(),
      metadata: z.record(z.string(), z.any()).optional(),
      reason: reasonSchema,
    })
    .superRefine((value, context) => {
      const fields = Object.keys(value).filter(
        (key) => key !== "reason" && value[key] !== undefined,
      );

      if (fields.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one subscription field must be provided.",
          path: ["body"],
        });
      }

      for (const field of fields) {
        if (!ADMIN_MANUAL_SUBSCRIPTION_FIELDS.includes(field)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Field '${field}' cannot be manually adjusted.`,
            path: [field],
          });
        }
      }
    }),
});

export const listPaymentsQuerySchema = z.object({
  params: emptyParams,
  body: emptyBody,
  query: paginationQuerySchema
    .merge(sortableQuerySchema)
    .merge(dateRangeQuerySchema)
    .extend({
      userId: objectIdSchema.optional(),
      state: z
        .enum([
          PAYMENT_STATES.PROCESSING,
          PAYMENT_STATES.SUCCEEDED,
          PAYMENT_STATES.FAILED,
          PAYMENT_STATES.CANCELED,
          PAYMENT_STATES.TIMEOUT,
          PAYMENT_STATES.RETRY_REQUIRED,
        ])
        .optional(),
      sourceDomain: z.string().trim().min(2).max(80).optional(),
      mismatchDetected: booleanQuerySchema.optional(),
      stripePaymentIntentId: z.string().trim().min(2).max(120).optional(),
    }),
});

export const paymentIdParamsSchema = z.object({
  params: z.object({ paymentId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z.object({}).default({}),
});

export const processPaymentTimeoutSchema = z.object({
  params: emptyParams,
  query: z.object({}).default({}),
  body: z.object({
    runAt: z.coerce.date().optional(),
    reason: z.string().trim().min(5).max(500).optional(),
  }),
});

export const manualAdjustPaymentSchema = z.object({
  params: z.object({ paymentId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z
    .object({
      state: z
        .enum([
          PAYMENT_STATES.PROCESSING,
          PAYMENT_STATES.SUCCEEDED,
          PAYMENT_STATES.FAILED,
          PAYMENT_STATES.CANCELED,
          PAYMENT_STATES.TIMEOUT,
          PAYMENT_STATES.RETRY_REQUIRED,
        ])
        .optional(),
      stateReason: z.string().trim().max(240).optional(),
      timeoutAt: z.coerce.date().nullable().optional(),
      finalizedAt: z.coerce.date().nullable().optional(),
      mismatchDetected: z.boolean().optional(),
      metadata: z.record(z.string(), z.any()).optional(),
      reason: reasonSchema,
    })
    .superRefine((value, context) => {
      const fields = Object.keys(value).filter(
        (key) => key !== "reason" && value[key] !== undefined,
      );

      if (fields.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one payment field must be provided.",
          path: ["body"],
        });
      }

      for (const field of fields) {
        if (!ADMIN_MANUAL_PAYMENT_FIELDS.includes(field)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Field '${field}' cannot be manually adjusted.`,
            path: [field],
          });
        }
      }
    }),
});

export const listCharitiesQuerySchema = z.object({
  params: emptyParams,
  body: emptyBody,
  query: paginationQuerySchema.merge(sortableQuerySchema).extend({
    status: z
      .enum([
        CHARITIES_STATUSES.ACTIVE,
        CHARITIES_STATUSES.INACTIVE,
        CHARITIES_STATUSES.ARCHIVED,
      ])
      .optional(),
    search: z.string().trim().min(1).max(120).optional(),
  }),
});

export const charityIdParamsSchema = z.object({
  params: z.object({ charityId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z.object({}).default({}),
});

export const createCharitySchema = z.object({
  params: emptyParams,
  query: z.object({}).default({}),
  body: z.object({
    code: z.string().trim().min(2).max(50).optional(),
    name: z.string().trim().min(2).max(160),
    mission: z.string().trim().min(10).max(2000),
    website: z.string().trim().max(400).optional(),
    currency: z.string().trim().min(3).max(3).optional(),
    supportedCurrencies: z.array(z.string().trim().min(3).max(3)).optional(),
    isFeatured: z.boolean().optional(),
    status: z
      .enum([
        CHARITIES_STATUSES.ACTIVE,
        CHARITIES_STATUSES.INACTIVE,
        CHARITIES_STATUSES.ARCHIVED,
      ])
      .optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    reason: reasonSchema,
  }),
});

export const updateCharitySchema = z.object({
  params: z.object({ charityId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z.object({
    code: z.string().trim().min(2).max(50).optional(),
    name: z.string().trim().min(2).max(160).optional(),
    mission: z.string().trim().min(10).max(2000).optional(),
    website: z.string().trim().max(400).optional(),
    currency: z.string().trim().min(3).max(3).optional(),
    supportedCurrencies: z.array(z.string().trim().min(3).max(3)).optional(),
    isFeatured: z.boolean().optional(),
    status: z
      .enum([
        CHARITIES_STATUSES.ACTIVE,
        CHARITIES_STATUSES.INACTIVE,
        CHARITIES_STATUSES.ARCHIVED,
      ])
      .optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    reason: reasonSchema,
  }),
});

export const updateContributionRuleSchema = z.object({
  params: emptyParams,
  query: z.object({}).default({}),
  body: z.object({
    gatewayFeePercentage: z.coerce.number().min(0).max(100).optional(),
    prizePoolPercentage: z.coerce.number().min(0).max(100).optional(),
    mandatoryCharityPercentage: z.coerce.number().min(0).max(100).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    reason: reasonSchema,
  }),
});

export const listDonationsQuerySchema = z.object({
  params: emptyParams,
  body: emptyBody,
  query: paginationQuerySchema
    .merge(sortableQuerySchema)
    .merge(dateRangeQuerySchema)
    .extend({
      userId: objectIdSchema.optional(),
      charityId: objectIdSchema.optional(),
      status: z
        .enum([
          DONATION_STATUSES.PROCESSING,
          DONATION_STATUSES.SUCCEEDED,
          DONATION_STATUSES.FAILED,
          DONATION_STATUSES.CANCELLED,
          DONATION_STATUSES.TIMEOUT,
          DONATION_STATUSES.RETRY_REQUIRED,
        ])
        .optional(),
      source: z.string().trim().min(2).max(80).optional(),
    }),
});

export const donationIdParamsSchema = z.object({
  params: z.object({ donationId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z.object({}).default({}),
});

export const manualAdjustDonationSchema = z.object({
  params: z.object({ donationId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z
    .object({
      status: z
        .enum([
          DONATION_STATUSES.PROCESSING,
          DONATION_STATUSES.SUCCEEDED,
          DONATION_STATUSES.FAILED,
          DONATION_STATUSES.CANCELLED,
          DONATION_STATUSES.TIMEOUT,
          DONATION_STATUSES.RETRY_REQUIRED,
        ])
        .optional(),
      finalizedAt: z.coerce.date().nullable().optional(),
      userMessage: z.string().trim().max(500).optional(),
      metadata: z.record(z.string(), z.any()).optional(),
      reason: reasonSchema,
    })
    .superRefine((value, context) => {
      const fields = Object.keys(value).filter(
        (key) => key !== "reason" && value[key] !== undefined,
      );

      if (fields.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one donation field must be provided.",
          path: ["body"],
        });
      }

      for (const field of fields) {
        if (!ADMIN_MANUAL_DONATION_FIELDS.includes(field)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Field '${field}' cannot be manually adjusted.`,
            path: [field],
          });
        }
      }
    }),
});

export const listPayoutsQuerySchema = z.object({
  params: emptyParams,
  body: emptyBody,
  query: paginationQuerySchema
    .merge(sortableQuerySchema)
    .merge(dateRangeQuerySchema)
    .extend({
      charityId: objectIdSchema.optional(),
      status: z
        .enum([
          CHARITY_PAYOUT_STATUSES.PENDING,
          CHARITY_PAYOUT_STATUSES.COMPLETED,
          CHARITY_PAYOUT_STATUSES.CANCELLED,
        ])
        .optional(),
      entryType: z
        .enum([
          CHARITY_PAYOUT_ENTRY_TYPES.PAYOUT,
          CHARITY_PAYOUT_ENTRY_TYPES.ADJUSTMENT_CREDIT,
          CHARITY_PAYOUT_ENTRY_TYPES.ADJUSTMENT_DEBIT,
        ])
        .optional(),
    }),
});

export const payoutIdParamsSchema = z.object({
  params: z.object({ payoutId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z.object({}).default({}),
});

export const createPayoutSchema = z.object({
  params: emptyParams,
  query: z.object({}).default({}),
  body: z.object({
    charityId: objectIdSchema,
    entryType: z.enum([
      CHARITY_PAYOUT_ENTRY_TYPES.PAYOUT,
      CHARITY_PAYOUT_ENTRY_TYPES.ADJUSTMENT_CREDIT,
      CHARITY_PAYOUT_ENTRY_TYPES.ADJUSTMENT_DEBIT,
    ]),
    amountInr: z.coerce.number().positive(),
    status: z
      .enum([
        CHARITY_PAYOUT_STATUSES.PENDING,
        CHARITY_PAYOUT_STATUSES.COMPLETED,
        CHARITY_PAYOUT_STATUSES.CANCELLED,
      ])
      .optional(),
    externalReference: z.string().trim().max(200).optional(),
    notes: z.string().trim().max(500).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    reason: reasonSchema,
  }),
});

export const updatePayoutSchema = z.object({
  params: z.object({ payoutId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z.object({
    status: z
      .enum([
        CHARITY_PAYOUT_STATUSES.PENDING,
        CHARITY_PAYOUT_STATUSES.COMPLETED,
        CHARITY_PAYOUT_STATUSES.CANCELLED,
      ])
      .optional(),
    externalReference: z.string().trim().max(200).optional(),
    notes: z.string().trim().max(500).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    reason: reasonSchema,
  }),
});

export const createCharityManualAdjustmentSchema = z.object({
  params: emptyParams,
  query: z.object({}).default({}),
  body: z.object({
    charityId: objectIdSchema,
    amountInr: z.coerce.number().positive(),
    adjustmentType: z.enum(["credit", "debit"]),
    paymentId: objectIdSchema.optional(),
    donationId: objectIdSchema.optional(),
    notes: z.string().trim().max(500).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    reason: reasonSchema,
  }),
});

export const listScoresQuerySchema = z.object({
  params: emptyParams,
  body: emptyBody,
  query: paginationQuerySchema
    .merge(sortableQuerySchema)
    .merge(dateRangeQuerySchema)
    .extend({
      userId: objectIdSchema.optional(),
      status: z
        .enum([SCORES_STATUSES.ACTIVE, SCORES_STATUSES.REMOVED])
        .optional(),
      includeBackdated: booleanQuerySchema.optional(),
      contestNumber: z.coerce.number().int().min(1).max(45).optional(),
    }),
});

export const scoreIdParamsSchema = z.object({
  params: z.object({ scoreId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z.object({}).default({}),
});

export const updateScoreSchema = z.object({
  params: z.object({ scoreId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z.object({
    playedDate: z.coerce.date().optional(),
    value: z.coerce.number().min(1).max(45).optional(),
    contestNumber: z.coerce.number().int().min(1).max(45).optional(),
    status: z
      .enum([SCORES_STATUSES.ACTIVE, SCORES_STATUSES.REMOVED])
      .optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    editReason: reasonSchema,
  }),
});

export const listDrawsQuerySchema = z.object({
  params: emptyParams,
  body: emptyBody,
  query: paginationQuerySchema
    .merge(sortableQuerySchema)
    .merge(dateRangeQuerySchema)
    .extend({
      status: z
        .enum([
          DRAW_SNAPSHOT_STATUSES.DRAFT,
          DRAW_SNAPSHOT_STATUSES.ENTRIES_LOCKED,
          DRAW_SNAPSHOT_STATUSES.PUBLISHED,
          DRAW_SNAPSHOT_STATUSES.CANCELLED,
        ])
        .optional(),
      year: z.coerce.number().int().min(2024).optional(),
      month: z.coerce.number().int().min(1).max(12).optional(),
    }),
});

export const drawIdParamsSchema = z.object({
  params: z.object({ drawId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z.object({}).default({}),
});

export const createDrawSchema = z.object({
  params: emptyParams,
  query: z.object({}).default({}),
  body: z.object({
    year: z.coerce.number().int().min(2024),
    month: z.coerce.number().int().min(1).max(12),
    drawAt: z.coerce.date(),
    prizePoolSnapshotStrategy: z.enum(["draw_day", "month_end"]).optional(),
    mode: z.enum([DRAW_MODES.RANDOM, DRAW_MODES.ALGORITHMIC]).optional(),
    reason: reasonSchema,
  }),
});

export const updateDrawSchema = z.object({
  params: z.object({ drawId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z.object({
    drawAt: z.coerce.date().optional(),
    eligibilityCutoffAt: z.coerce.date().optional(),
    prizePoolSnapshotAt: z.coerce.date().optional(),
    status: z
      .enum([
        DRAW_SNAPSHOT_STATUSES.DRAFT,
        DRAW_SNAPSHOT_STATUSES.ENTRIES_LOCKED,
        DRAW_SNAPSHOT_STATUSES.CANCELLED,
      ])
      .optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    reason: reasonSchema,
  }),
});

export const runDrawSimulationSchema = z.object({
  params: z.object({ drawId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z.object({
    winningNumbers: z.array(z.coerce.number().int().min(1).max(45)).optional(),
    notes: z.string().trim().max(500).optional(),
  }),
});

export const addManualJackpotFundSchema = z.object({
  params: emptyParams,
  query: z.object({}).default({}),
  body: z.object({
    amountInr: z.coerce.number().positive(),
    notes: z.string().trim().max(500).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    reason: reasonSchema,
  }),
});

export const listWinnersQuerySchema = z.object({
  params: emptyParams,
  body: emptyBody,
  query: paginationQuerySchema
    .merge(sortableQuerySchema)
    .merge(dateRangeQuerySchema)
    .extend({
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
    }),
});

export const winnerIdParamsSchema = z.object({
  params: z.object({ winnerId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z.object({}).default({}),
});

export const winnerProofParamsSchema = z.object({
  params: z.object({
    winnerId: objectIdSchema,
    proofId: objectIdSchema,
  }),
  query: z.object({}).default({}),
  body: z.object({}).default({}),
});

export const reviewWinnerProofSchema = z.object({
  params: z.object({
    winnerId: objectIdSchema,
    proofId: objectIdSchema,
  }),
  query: z.object({}).default({}),
  body: z.object({
    status: z.enum([
      WINNER_PROOF_SUBMISSION_STATUSES.APPROVED,
      WINNER_PROOF_SUBMISSION_STATUSES.REJECTED,
    ]),
    rejectionReason: z.string().trim().max(500).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    reason: reasonSchema,
  }),
});

export const updateWinnerPayoutSchema = z.object({
  params: z.object({ winnerId: objectIdSchema }),
  query: z.object({}).default({}),
  body: z.object({
    payoutStatus: z.enum([
      WINNER_PAYOUT_STATUSES.PENDING_VERIFICATION,
      WINNER_PAYOUT_STATUSES.APPROVED,
      WINNER_PAYOUT_STATUSES.REJECTED,
      WINNER_PAYOUT_STATUSES.PAYOUT_PENDING,
      WINNER_PAYOUT_STATUSES.PAID,
    ]),
    rejectionReason: z.string().trim().max(500).optional(),
    payoutReference: z.string().trim().max(200).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    reason: reasonSchema,
  }),
});

export const listAuditEventsQuerySchema = z.object({
  params: emptyParams,
  body: emptyBody,
  query: paginationQuerySchema
    .merge(sortableQuerySchema)
    .merge(dateRangeQuerySchema)
    .extend({
      actorId: objectIdSchema.optional(),
      action: z.string().trim().min(2).max(180).optional(),
      entity: z.string().trim().min(2).max(120).optional(),
      requestId: z.string().trim().max(120).optional(),
    }),
});
