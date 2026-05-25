import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/constants";
import { charitiesService, subscriptionsService } from "@/services";
import type { CharityRecord, SubscriptionPlan } from "@/types";
import { getErrorMessage } from "@/utils";

import { fallbackPublicCharities, fallbackPublicPlans } from "./content";

export const PUBLIC_CATALOG_STALE_TIME_MS = 60_000;

export interface PublicCatalogData<T> {
  items: T[];
  source: "live" | "fallback";
  fallbackReason?: string;
}

export const resolvePublicCatalogData = <T>({
  items,
  fallbackItems,
  error
}: {
  items?: T[] | null;
  fallbackItems: T[];
  error?: unknown;
}): PublicCatalogData<T> => {
  if (Array.isArray(items) && items.length > 0) {
    return {
      items,
      source: "live"
    };
  }

  return {
    items: fallbackItems,
    source: "fallback",
    fallbackReason: error
      ? getErrorMessage(error, "Live catalog data is unavailable right now.")
      : undefined
  };
};

export const usePublicPlansCatalog = () =>
  useQuery({
    queryKey: queryKeys.publicPlans,
    queryFn: async () => {
      try {
        const response = await subscriptionsService.listPlans();

        return resolvePublicCatalogData<SubscriptionPlan>({
          items: response.data,
          fallbackItems: fallbackPublicPlans
        });
      } catch (error) {
        return resolvePublicCatalogData<SubscriptionPlan>({
          fallbackItems: fallbackPublicPlans,
          error
        });
      }
    },
    initialData: {
      items: fallbackPublicPlans,
      source: "fallback"
    } satisfies PublicCatalogData<SubscriptionPlan>,
    initialDataUpdatedAt: 0,
    retry: false,
    staleTime: PUBLIC_CATALOG_STALE_TIME_MS,
    meta: {
      suppressGlobalErrorToast: true
    }
  });

export const usePublicCharitiesCatalog = () =>
  useQuery({
    queryKey: queryKeys.publicCharities,
    queryFn: async () => {
      try {
        const response = await charitiesService.list();

        return resolvePublicCatalogData<CharityRecord>({
          items: response.data,
          fallbackItems: fallbackPublicCharities
        });
      } catch (error) {
        return resolvePublicCatalogData<CharityRecord>({
          fallbackItems: fallbackPublicCharities,
          error
        });
      }
    },
    initialData: {
      items: fallbackPublicCharities,
      source: "fallback"
    } satisfies PublicCatalogData<CharityRecord>,
    initialDataUpdatedAt: 0,
    retry: false,
    staleTime: PUBLIC_CATALOG_STALE_TIME_MS,
    meta: {
      suppressGlobalErrorToast: true
    }
  });

export const isPublicCatalogPreview = <T,>(
  data?: PublicCatalogData<T> | null
) => data?.source === "fallback";

export const getPublicCatalogNotice = <T,>(
  data?: PublicCatalogData<T> | null
) => {
  if (!isPublicCatalogPreview(data)) {
    return null;
  }

  return data?.fallbackReason
    ? `Showing preview content while live catalog data is unavailable. ${data.fallbackReason}`
    : "Showing preview content while live catalog data loads.";
};
