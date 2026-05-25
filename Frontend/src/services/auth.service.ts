import { apiClient } from "./api/client";

import type {
  ApiSuccessResponse,
  LoginPayload,
  ProfileVerificationState,
  RegisterPayload
} from "@/types";

export const authService = {
  register: (payload: RegisterPayload) =>
    apiClient.requestContract({
      path: "/auth/register",
      method: "POST",
      body: payload
    }),
  login: (payload: LoginPayload) =>
    apiClient.requestContract({
      path: "/auth/login",
      method: "POST",
      body: payload
    }),
  logout: (refreshToken: string) =>
    apiClient.requestContract({
      path: "/auth/logout",
      method: "POST",
      auth: true,
      body: { refreshToken }
    }),
  me: () =>
    apiClient.requestContract({
      path: "/auth/me",
      method: "GET",
      auth: true
    }),
  verifyEmail: (token: string) =>
    apiClient.requestContract({
      path: "/auth/verify-email",
      method: "POST",
      body: { token }
    }),
  resendVerification: (email: string) =>
    apiClient.requestContract({
      path: "/auth/resend-verification",
      method: "POST",
      body: { email }
    }),
  forgotPassword: (email: string) =>
    apiClient.requestContract({
      path: "/auth/forgot-password",
      method: "POST",
      body: { email }
    }),
  resetPassword: (token: string, newPassword: string) =>
    apiClient.requestContract({
      path: "/auth/reset-password",
      method: "POST",
      body: { token, newPassword }
    }),
  getProfileStatus: (): Promise<ApiSuccessResponse<ProfileVerificationState>> =>
    apiClient.requestContract({
      path: "/users/me/profile-status",
      method: "GET",
      auth: true
    })
};
