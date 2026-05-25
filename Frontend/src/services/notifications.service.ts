import type { NotificationRecord } from "@/types";

import { apiClient } from "./api/client";

export const notificationsService = {
  listMine: () =>
    apiClient.requestContract({
      path: "/notifications/mine",
      method: "GET",
      auth: true
    }),
  update: (id: string, payload: Partial<NotificationRecord>) =>
    apiClient.requestContract({
      path: `/notifications/${id}` as `/notifications/${string}`,
      method: "PATCH",
      auth: true,
      body: payload,
      idempotencyKey: crypto.randomUUID()
    })
};
