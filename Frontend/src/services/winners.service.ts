import type { WinnerProofSubmissionRecord, WinnerRecord } from "@/types";

import { apiClient } from "./api/client";

export const winnersService = {
  listMine: () =>
    apiClient.requestContract({
      path: "/winners/mine",
      method: "GET",
      auth: true
    }),
  getMineById: (id: string) =>
    apiClient.request<WinnerRecord>({
      path: `/winners/mine/${id}`,
      method: "GET",
      auth: true
    }),
  listProofs: (winnerId: string) =>
    apiClient.request<WinnerProofSubmissionRecord[]>({
      path: `/winners/${winnerId}/proofs`,
      method: "GET",
      auth: true
    }),
  submitProofs: (
    winnerId: string,
    payload: {
      files: Array<{
        fileUrl: string;
        fileName: string;
        fileType?: string;
        sizeBytes?: number;
      }>;
      metadata?: Record<string, string | number | boolean>;
    }
  ) =>
    apiClient.request<WinnerProofSubmissionRecord>({
      path: `/winners/${winnerId}/proofs`,
      method: "POST",
      auth: true,
      body: payload,
      idempotencyKey: crypto.randomUUID()
    })
};
