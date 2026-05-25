import { apiClient } from "./api/client";

export const paymentsService = {
  listMine: () =>
    apiClient.requestContract({
      path: "/payments/mine",
      method: "GET",
      auth: true
    })
};
