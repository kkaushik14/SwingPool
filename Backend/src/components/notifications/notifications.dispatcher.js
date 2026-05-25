import { logger } from "../../logger/index.js";

import { notificationsService } from "./notifications.service.js";

const notificationsDispatchLogger = logger.child({
  scope: "notifications-dispatcher",
});

export const dispatchNotificationEvent = ({
  scope = "notifications",
  userId,
  eventType,
  context = {},
  dedupeKey,
  requestContext = {},
}) => {
  if (!userId || !eventType) {
    return null;
  }

  void notificationsService
    .dispatchEvent({
      userId,
      eventType,
      context,
      dedupeKey,
      requestContext,
    })
    .catch((error) => {
      notificationsDispatchLogger.warn(
        {
          scope,
          requestId: requestContext.requestId || null,
          userId,
          eventType,
          error: error.message,
        },
        "Failed to dispatch notification event",
      );
    });

  return null;
};
