import { createHash } from "node:crypto";

import { AppError } from "../../errors/index.js";
import { logger } from "../../logger/index.js";
import { notificationProviderService } from "../../services/index.js";
import { usersRepository } from "../users/users.repository.js";

import { buildNotificationTemplate } from "./notifications.templates.js";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_DELIVERY_STATUSES,
  NOTIFICATION_EVENT_TYPES,
} from "./notifications.enums.js";
import { notificationsRepository } from "./notifications.repository.js";

const notificationsLogger = logger.child({ scope: "notifications" });

const buildDefaultDedupeKey = ({ userId, eventType, context = {} }) => {
  const digest = createHash("sha256")
    .update(JSON.stringify(context))
    .digest("hex")
    .slice(0, 16);

  return `${eventType}:${userId}:${digest}`;
};

const makeChannelDedupeKey = ({ dedupeKey, channel }) =>
  `${dedupeKey}:${channel}`;

const isDuplicateKeyError = (error) => error?.code === 11000;

const resolveChannels = (templateChannels = [], overrideChannels = null) => {
  const source = Array.isArray(overrideChannels)
    ? overrideChannels
    : templateChannels;

  const normalized = source
    .map((item) =>
      String(item || "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);

  if (!normalized.includes(NOTIFICATION_CHANNELS.IN_APP)) {
    normalized.unshift(NOTIFICATION_CHANNELS.IN_APP);
  }

  return [...new Set(normalized)];
};

const resolveRecipient = ({ channel, user, profile }) => {
  if (channel === NOTIFICATION_CHANNELS.EMAIL) {
    return user?.email || "";
  }

  if (channel === NOTIFICATION_CHANNELS.SMS) {
    return profile?.phone || "";
  }

  return "";
};

const createInAppNotification = async ({
  userId,
  eventType,
  title,
  message,
  dedupeKey,
  metadata = {},
}) => {
  if (!dedupeKey) {
    return notificationsRepository.create({
      userId,
      eventType,
      title,
      message,
      channel: NOTIFICATION_CHANNELS.IN_APP,
      metadata,
    });
  }

  const existing = await notificationsRepository.findByDedupeKey(dedupeKey);

  if (existing) {
    return existing;
  }

  try {
    return await notificationsRepository.create({
      userId,
      eventType,
      title,
      message,
      channel: NOTIFICATION_CHANNELS.IN_APP,
      dedupeKey,
      metadata,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return notificationsRepository.findByDedupeKey(dedupeKey);
    }

    throw error;
  }
};

export const notificationsService = {
  async listForUser(userId) {
    return notificationsRepository.listByUser(userId);
  },

  async getForUser(userId, id) {
    const record = await notificationsRepository.findByUserAndId(userId, id);

    if (!record) {
      throw AppError.notFound("Notification record not found.");
    }

    return record;
  },

  async createForUser(userId, payload) {
    return notificationsRepository.create({
      ...payload,
      userId,
      eventType: payload.eventType,
      channel: payload.channel || NOTIFICATION_CHANNELS.IN_APP,
    });
  },

  async updateForUser(userId, id, payload) {
    const existing = await notificationsRepository.findByUserAndId(userId, id);

    if (!existing) {
      throw AppError.notFound("Notification record not found.");
    }

    return notificationsRepository.updateById(id, payload);
  },

  async dispatchEvent({
    userId,
    eventType,
    context = {},
    channels = null,
    dedupeKey = "",
    requestContext = {},
  }) {
    if (!userId) {
      throw AppError.validation(
        "userId is required for notification dispatch.",
      );
    }

    if (!eventType) {
      throw AppError.validation(
        "eventType is required for notification dispatch.",
      );
    }

    const [user, profile] = await Promise.all([
      usersRepository.findById(userId),
      usersRepository.findProfileByUserId(userId),
    ]);

    if (!user) {
      return {
        dispatched: false,
        reason: "user_not_found",
        dedupeKey: null,
      };
    }

    const resolvedDedupeKey =
      dedupeKey || buildDefaultDedupeKey({ userId, eventType, context });
    const template = buildNotificationTemplate({
      eventType,
      context,
      user,
    });
    const targetChannels = resolveChannels(template.channels, channels);

    const notification = await createInAppNotification({
      userId,
      eventType,
      title: template.title,
      message: template.message,
      dedupeKey: makeChannelDedupeKey({
        dedupeKey: resolvedDedupeKey,
        channel: NOTIFICATION_CHANNELS.IN_APP,
      }),
      metadata: {
        eventType,
        ...context,
      },
    });

    const deliveryResults = [];

    for (const channel of targetChannels) {
      if (channel === NOTIFICATION_CHANNELS.IN_APP) {
        deliveryResults.push({
          channel,
          status: NOTIFICATION_DELIVERY_STATUSES.SENT,
          dedupeKey: makeChannelDedupeKey({
            dedupeKey: resolvedDedupeKey,
            channel,
          }),
          provider: "in_app",
        });
        continue;
      }

      const channelDedupeKey = makeChannelDedupeKey({
        dedupeKey: resolvedDedupeKey,
        channel,
      });
      const existingDelivery =
        await notificationsRepository.findDeliveryByDedupeKey(channelDedupeKey);

      if (existingDelivery) {
        deliveryResults.push({
          channel,
          status: existingDelivery.status,
          dedupeKey: channelDedupeKey,
          provider: existingDelivery.provider,
          duplicate: true,
        });
        continue;
      }

      const recipient = resolveRecipient({ channel, user, profile });
      let createdDelivery;

      try {
        createdDelivery = await notificationsRepository.createDelivery({
          notificationId: notification.id,
          userId,
          eventType,
          channel,
          status: NOTIFICATION_DELIVERY_STATUSES.QUEUED,
          provider: "",
          recipient,
          subject: template.subject || "",
          message: template.message,
          dedupeKey: channelDedupeKey,
          metadata: {
            eventType,
            requestId: requestContext.requestId || null,
            ...context,
          },
        });
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          const duplicate =
            await notificationsRepository.findDeliveryByDedupeKey(
              channelDedupeKey,
            );
          deliveryResults.push({
            channel,
            status: duplicate?.status || NOTIFICATION_DELIVERY_STATUSES.QUEUED,
            dedupeKey: channelDedupeKey,
            provider: duplicate?.provider || "",
            duplicate: true,
          });
          continue;
        }

        throw error;
      }

      if (!recipient) {
        const skipped = await notificationsRepository.updateDeliveryById(
          createdDelivery.id,
          {
            status: NOTIFICATION_DELIVERY_STATUSES.SKIPPED,
            provider: "missing_recipient",
            errorMessage: `No recipient resolved for channel '${channel}'.`,
            lastAttemptAt: new Date(),
          },
        );

        deliveryResults.push({
          channel,
          status: skipped.status,
          dedupeKey: channelDedupeKey,
          provider: skipped.provider,
          skipped: true,
        });
        continue;
      }

      const providerResult = await notificationProviderService.send(
        {
          channel,
          recipient,
          subject: template.subject || "",
          message: template.message,
          metadata: {
            eventType,
            ...context,
          },
        },
        requestContext,
      );

      const isSent = providerResult.status === "sent";
      const updatedDelivery = await notificationsRepository.updateDeliveryById(
        createdDelivery.id,
        {
          status: isSent
            ? NOTIFICATION_DELIVERY_STATUSES.SENT
            : providerResult.status === "skipped"
              ? NOTIFICATION_DELIVERY_STATUSES.SKIPPED
              : NOTIFICATION_DELIVERY_STATUSES.FAILED,
          provider: providerResult.providerName || "",
          providerMessageId: providerResult.providerMessageId || "",
          deliveredAt: isSent ? new Date() : null,
          lastAttemptAt: new Date(),
          errorMessage: providerResult.errorMessage || "",
        },
      );

      deliveryResults.push({
        channel,
        status: updatedDelivery.status,
        dedupeKey: channelDedupeKey,
        provider: updatedDelivery.provider,
        providerMessageId: updatedDelivery.providerMessageId || null,
      });
    }

    notificationsLogger.info(
      {
        requestId: requestContext.requestId || null,
        userId,
        eventType,
        dedupeKey: resolvedDedupeKey,
        channels: targetChannels,
      },
      "Notification event dispatched",
    );

    return {
      dispatched: true,
      eventType,
      dedupeKey: resolvedDedupeKey,
      notification,
      deliveries: deliveryResults,
    };
  },

  async dispatchEventToUsers({
    userIds = [],
    eventType,
    context = {},
    channels = null,
    dedupeKeyPrefix = "",
    requestContext = {},
  }) {
    const uniqueUserIds = [...new Set(userIds.map((item) => String(item)))];
    const results = [];

    for (const userId of uniqueUserIds) {
      const perUserDedupeKey = dedupeKeyPrefix
        ? `${dedupeKeyPrefix}:user:${userId}`
        : "";

      results.push(
        await this.dispatchEvent({
          userId,
          eventType,
          context,
          channels,
          dedupeKey: perUserDedupeKey,
          requestContext,
        }),
      );
    }

    return {
      totalUsers: uniqueUserIds.length,
      results,
    };
  },
};
