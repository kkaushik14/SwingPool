import { apiClient } from "./api/client";

export const reportsService = {
  getOverview: () =>
    apiClient.requestContract({
      path: "/reports/overview",
      method: "GET",
      auth: true
    })
};
