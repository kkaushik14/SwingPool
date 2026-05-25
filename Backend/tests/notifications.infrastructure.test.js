import { describe, expect, it, vi } from "vitest";

import { notificationProviderService } from "../src/services/notification-provider.service.js";
import { usersRepository } from "../src/components/users/users.repository.js";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_TYPES,
} from "../src/components/notifications/notifications.enums.js";
import { notificationsRepository } from "../src/components/notifications/notifications.repository.js";
import { notificationsService } from "../src/components/notifications/notifications.service.js";

describe("Notifications Infrastructure", () => {
  it("dispatches event notifications and suppresses duplicate deliveries", async () => {
    const userId = "507f1f77bcf86cd799439011";
    const dedupeKey = "payment:payment-1:state:succeeded";

    const inAppNotification = {
      id: "notification-1",
      userId,
      eventType: NOTIFICATION_EVENT_TYPES.PAYMENT_SUCCESS,
    };
    const queuedDelivery = {
      id: "delivery-1",
      status: "queued",
      provider: "",
    };
    const sentDelivery = {
      id: "delivery-1",
      status: "sent",
      provider: "log",
      providerMessageId: "email-1",
    };
    const existingDelivery = {
      id: "delivery-1",
      status: "sent",
      provider: "log",
    };

    vi.spyOn(usersRepository, "findById").mockResolvedValue({
      id: userId,
      email: "user@swingpool.test",
      displayName: "Test User",
    });
    vi.spyOn(usersRepository, "findProfileByUserId").mockResolvedValue({
      userId,
      phone: "+919999999999",
    });
    vi.spyOn(notificationsRepository, "findByDedupeKey")
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(inAppNotification);
    vi.spyOn(notificationsRepository, "create").mockResolvedValue(
      inAppNotification,
    );
    vi.spyOn(notificationsRepository, "findDeliveryByDedupeKey")
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existingDelivery);
    vi.spyOn(notificationsRepository, "createDelivery").mockResolvedValue(
      queuedDelivery,
    );
    vi.spyOn(notificationsRepository, "updateDeliveryById").mockResolvedValue(
      sentDelivery,
    );
    const providerSpy = vi
      .spyOn(notificationProviderService, "send")
      .mockResolvedValue({
        status: "sent",
        providerName: "log",
        providerMessageId: "email-1",
        errorMessage: "",
      });

    const first = await notificationsService.dispatchEvent({
      userId,
      eventType: NOTIFICATION_EVENT_TYPES.PAYMENT_SUCCESS,
      context: {
        amountMajor: "179.00",
        currency: "INR",
      },
      channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
      dedupeKey,
      requestContext: {
        requestId: "req-1",
      },
    });

    const second = await notificationsService.dispatchEvent({
      userId,
      eventType: NOTIFICATION_EVENT_TYPES.PAYMENT_SUCCESS,
      context: {
        amountMajor: "179.00",
        currency: "INR",
      },
      channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
      dedupeKey,
      requestContext: {
        requestId: "req-2",
      },
    });

    expect(first.dispatched).toBe(true);
    expect(second.dispatched).toBe(true);
    expect(providerSpy).toHaveBeenCalledTimes(1);
    expect(notificationsRepository.create).toHaveBeenCalledTimes(1);
    expect(notificationsRepository.createDelivery).toHaveBeenCalledTimes(1);
    expect(
      second.deliveries.find(
        (item) => item.channel === NOTIFICATION_CHANNELS.EMAIL,
      )?.duplicate,
    ).toBe(true);
  });
});
