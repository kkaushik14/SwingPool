import { apiClient } from "./api/client";

export const healthService = {
  getStatus: () =>
    apiClient.requestContract({
      path: "/health",
      method: "GET"
    })
};
