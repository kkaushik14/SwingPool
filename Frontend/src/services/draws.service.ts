import type {
  DrawConfigRecord,
  DrawEntryRecord,
  DrawPrizePoolRecord,
  DrawPublishedResultRecord,
  DrawRecord
} from "@/types";

import { apiClient } from "./api/client";

export const drawsService = {
  list: () =>
    apiClient.request<DrawRecord[]>({
      path: "/draws",
      method: "GET",
      auth: true
    }),
  getById: (id: string) =>
    apiClient.request<DrawRecord>({
      path: `/draws/${id}`,
      method: "GET",
      auth: true
    }),
  listEntries: (id: string) =>
    apiClient.request<DrawEntryRecord[]>({
      path: `/draws/${id}/entries`,
      method: "GET",
      auth: true
    }),
  getPrizePool: (id: string) =>
    apiClient.request<DrawPrizePoolRecord | null>({
      path: `/draws/${id}/prize-pool`,
      method: "GET",
      auth: true
    }),
  getPublishedResult: (id: string) =>
    apiClient.request<DrawPublishedResultRecord | null>({
      path: `/draws/${id}/result`,
      method: "GET",
      auth: true
    }),
  getConfig: () =>
    apiClient.request<DrawConfigRecord>({
      path: "/draws/config",
      method: "GET",
      auth: true
    })
};
