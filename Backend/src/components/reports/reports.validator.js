import { z } from "zod";

import {
  PROFILE_VERIFICATION_STATUSES,
  USER_ROLES,
  USER_STATUSES,
} from "../../enums/index.js";
import { paginationQuerySchema } from "../../validators/index.js";
import { DRAW_SNAPSHOT_STATUSES } from "../draws/draws.enums.js";
import { PAYMENT_STATES } from "../payments/payments.enums.js";
import { SUBSCRIPTION_STATUSES } from "../subscriptions/subscriptions.enums.js";
import { WINNER_PAYOUT_STATUSES } from "../winners/winners.enums.js";

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

const emptyParams = z.object({}).default({});
const emptyBody = z.object({}).default({});

export const overviewReportQuerySchema = z.object({
  params: emptyParams,
  body: emptyBody,
  query: dateRangeQuerySchema,
});

export const usersReportQuerySchema = z.object({
  params: emptyParams,
  body: emptyBody,
  query: paginationQuerySchema
    .merge(sortableQuerySchema)
    .merge(dateRangeQuerySchema)
    .extend({
      role: z.enum([USER_ROLES.USER, USER_ROLES.ADMIN]).optional(),
      status: z
        .enum([
          USER_STATUSES.PENDING_VERIFICATION,
          USER_STATUSES.VERIFIED,
          USER_STATUSES.SUSPENDED,
          USER_STATUSES.INACTIVE,
        ])
        .optional(),
      verificationStatus: z
        .enum([
          PROFILE_VERIFICATION_STATUSES.PENDING_VERIFICATION,
          PROFILE_VERIFICATION_STATUSES.VERIFIED,
          PROFILE_VERIFICATION_STATUSES.REJECTED,
        ])
        .optional(),
      emailVerified: booleanQuerySchema.optional(),
      search: z.string().trim().min(1).max(120).optional(),
    }),
});

export const subscriptionsReportQuerySchema = z.object({
  params: emptyParams,
  body: emptyBody,
  query: paginationQuerySchema
    .merge(sortableQuerySchema)
    .merge(dateRangeQuerySchema)
    .extend({
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
      planCode: z.string().trim().min(2).max(40).optional(),
      userId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
    }),
});

export const paymentsReportQuerySchema = z.object({
  params: emptyParams,
  body: emptyBody,
  query: paginationQuerySchema
    .merge(sortableQuerySchema)
    .merge(dateRangeQuerySchema)
    .extend({
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
      userId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
    }),
});

export const charitiesReportQuerySchema = z.object({
  params: emptyParams,
  body: emptyBody,
  query: dateRangeQuerySchema.extend({
    charityId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .optional(),
  }),
});

export const drawsReportQuerySchema = z.object({
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

export const winnersReportQuerySchema = z.object({
  params: emptyParams,
  body: emptyBody,
  query: paginationQuerySchema
    .merge(sortableQuerySchema)
    .merge(dateRangeQuerySchema)
    .extend({
      payoutStatus: z
        .enum([
          WINNER_PAYOUT_STATUSES.PENDING_VERIFICATION,
          WINNER_PAYOUT_STATUSES.APPROVED,
          WINNER_PAYOUT_STATUSES.REJECTED,
          WINNER_PAYOUT_STATUSES.PAYOUT_PENDING,
          WINNER_PAYOUT_STATUSES.PAID,
        ])
        .optional(),
      drawId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
      userId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
      matchCount: z.coerce.number().int().min(3).max(5).optional(),
    }),
});
