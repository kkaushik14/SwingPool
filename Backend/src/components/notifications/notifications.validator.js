import { z } from "zod";

import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATIONS_STATUSES,
} from "./notifications.enums.js";

export const createNotificationSchema = z.object({
  body: z.object({
    eventType: z.enum([
      NOTIFICATION_EVENT_TYPES.SIGNUP_VERIFICATION,
      NOTIFICATION_EVENT_TYPES.PAYMENT_SUCCESS,
      NOTIFICATION_EVENT_TYPES.PAYMENT_FAILURE,
      NOTIFICATION_EVENT_TYPES.RENEWAL_REMINDER,
      NOTIFICATION_EVENT_TYPES.GRACE_PERIOD_WARNING,
      NOTIFICATION_EVENT_TYPES.SUBSCRIPTION_EXPIRY,
      NOTIFICATION_EVENT_TYPES.DRAW_PUBLISHED,
      NOTIFICATION_EVENT_TYPES.WINNER_SELECTED,
      NOTIFICATION_EVENT_TYPES.PROOF_REJECTED,
      NOTIFICATION_EVENT_TYPES.PAYOUT_COMPLETED,
    ]),
    title: z.string().trim().min(2).max(160),
    message: z.string().trim().min(2).max(600),
    channel: z
      .enum([
        NOTIFICATION_CHANNELS.IN_APP,
        NOTIFICATION_CHANNELS.EMAIL,
        NOTIFICATION_CHANNELS.SMS,
      ])
      .optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const updateNotificationSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2).max(160).optional(),
    message: z.string().trim().min(2).max(600).optional(),
    channel: z
      .enum([
        NOTIFICATION_CHANNELS.IN_APP,
        NOTIFICATION_CHANNELS.EMAIL,
        NOTIFICATION_CHANNELS.SMS,
      ])
      .optional(),
    readAt: z.coerce.date().nullable().optional(),
    status: z
      .enum([
        NOTIFICATIONS_STATUSES.ACTIVE,
        NOTIFICATIONS_STATUSES.INACTIVE,
        NOTIFICATIONS_STATUSES.ARCHIVED,
      ])
      .optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
});

export const notificationsIdParamsSchema = z.object({
  body: z.object({}).default({}),
  query: z.object({}).default({}),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
});
