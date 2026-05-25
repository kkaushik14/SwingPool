import { apiClient } from "./api/client";

export const scoresService = {
  listMine: () =>
    apiClient.requestContract({
      path: "/scores/mine",
      method: "GET",
      auth: true
    }),
  listQualifying: () =>
    apiClient.requestContract({
      path: "/scores/mine/competition/qualifying",
      method: "GET",
      auth: true
    }),
  getEligibility: () =>
    apiClient.requestContract({
      path: "/scores/mine/competition/eligibility",
      method: "GET",
      auth: true
    }),
  create: (payload: {
    playedDate: string;
    value: number;
    contestNumber?: number;
    metadata?: Record<string, string | number | boolean>;
  }) =>
    apiClient.requestContract({
      path: "/scores",
      method: "POST",
      auth: true,
      body: {
        playedDate: payload.playedDate,
        value: payload.value,
        contestNumber: payload.contestNumber ?? payload.value,
        metadata: payload.metadata
      },
      idempotencyKey: crypto.randomUUID()
    })
};
