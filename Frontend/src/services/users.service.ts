import type { UserProfile } from "@/types";

import { apiClient } from "./api/client";

export const usersService = {
  getMe: () =>
    apiClient.requestContract({
      path: "/users/me",
      method: "GET",
      auth: true
    }),
  updateProfile: (payload: Partial<UserProfile>) =>
    apiClient.requestContract({
      path: "/users/me/profile",
      method: "PATCH",
      auth: true,
      body: payload,
      idempotencyKey: crypto.randomUUID()
    }),
  getProfileStatus: () =>
    apiClient.requestContract({
      path: "/users/me/profile-status",
      method: "GET",
      auth: true
    })
};
