import { z } from "zod";

import {
  PROFILE_VERIFICATION_STATUSES,
  USER_ROLES,
  USER_STATUSES,
} from "../../enums/index.js";
import { objectIdSchema } from "../../validators/index.js";

export const userIdParamsSchema = z.object({
  body: z.object({}).default({}),
  query: z.object({}).default({}),
  params: z.object({
    id: objectIdSchema,
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(2).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    phone: z.string().trim().min(6).max(20).optional(),
    dateOfBirth: z.coerce.date().optional(),
    handicapIndex: z.number().min(0).max(54).optional(),
    addressLine1: z.string().trim().min(2).max(120).optional(),
    city: z.string().trim().min(2).max(80).optional(),
    state: z.string().trim().min(2).max(80).optional(),
    postalCode: z.string().trim().min(2).max(20).optional(),
    country: z.string().trim().min(2).max(80).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const adminUpdateUserSchema = z.object({
  body: z.object({
    role: z.enum([USER_ROLES.USER, USER_ROLES.ADMIN]).optional(),
    status: z
      .enum([
        USER_STATUSES.PENDING_VERIFICATION,
        USER_STATUSES.VERIFIED,
        USER_STATUSES.SUSPENDED,
        USER_STATUSES.INACTIVE,
      ])
      .optional(),
    mustRotatePassword: z.boolean().optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({
    id: objectIdSchema,
  }),
});

export const adminVerifyProfileSchema = z.object({
  body: z.object({
    verificationStatus: z.enum([
      PROFILE_VERIFICATION_STATUSES.VERIFIED,
      PROFILE_VERIFICATION_STATUSES.REJECTED,
      PROFILE_VERIFICATION_STATUSES.PENDING_VERIFICATION,
    ]),
    verificationReason: z.string().trim().max(300).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({
    id: objectIdSchema,
  }),
});
