import { apiClient } from "./api/client";

export const subscriptionsService = {
  listPlans: () =>
    apiClient.requestContract({
      path: "/subscriptions/plans",
      method: "GET"
    }),
  getConfig: () =>
    apiClient.requestContract({
      path: "/subscriptions/config",
      method: "GET"
    }),
  listMine: () =>
    apiClient.requestContract({
      path: "/subscriptions/mine",
      method: "GET",
      auth: true
    }),
  create: ({
    planCode,
    charityId,
    couponCode,
    optionalDonationInr,
    metadata
  }: {
    planCode: string;
    charityId?: string;
    couponCode?: string;
    optionalDonationInr?: number;
    metadata?: Record<string, string | number | boolean>;
  }) =>
    apiClient.requestContract({
      path: "/subscriptions",
      method: "POST",
      auth: true,
      body: {
        planCode,
        charityId,
        couponCode,
        optionalDonationInr,
        metadata
      },
      idempotencyKey: crypto.randomUUID()
    })
};
