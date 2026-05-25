import type { CharityRecord } from "@/types";

import { apiClient } from "./api/client";

export const charitiesService = {
  list: () =>
    apiClient.requestContract({
      path: "/charities",
      method: "GET"
    }),
  getById: (id: string) =>
    apiClient.request<CharityRecord>({
      path: `/charities/${id}`,
      method: "GET"
    }),
  getMySelection: () =>
    apiClient.requestContract({
      path: "/charities/my/selection",
      method: "GET",
      auth: true
    }),
  setMySelection: (charityId: string, reason?: string) =>
    apiClient.requestContract({
      path: "/charities/my/selection",
      method: "POST",
      auth: true,
      body: { charityId, reason },
      idempotencyKey: crypto.randomUUID()
    }),
  listMyDonations: () =>
    apiClient.requestContract({
      path: "/charities/my/donations",
      method: "GET",
      auth: true
    })
};
