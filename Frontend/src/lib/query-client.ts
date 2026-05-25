import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import { pushToast } from "@/store";
import { ApiRequestError } from "@/types";
import { getErrorMessage } from "@/utils";

const MAX_QUERY_RETRIES = 2;
const isBrowserOffline = () =>
  typeof navigator !== "undefined" && navigator.onLine === false;

export const isRetryableRequestError = (error: unknown) => {
  if (isBrowserOffline()) {
    return false;
  }

  if (!(error instanceof ApiRequestError)) {
    return true;
  }

  return (
    error.statusCode === 0 ||
    error.statusCode === 408 ||
    error.statusCode === 429 ||
    error.statusCode >= 500
  );
};

export const shouldRetryRequest = (failureCount: number, error: unknown) =>
  failureCount < MAX_QUERY_RETRIES && isRetryableRequestError(error);

const shouldShowQueryErrorToast = (query: {
  meta?: Record<string, unknown>;
  state: {
    data: unknown;
  };
}) =>
  query.state.data !== undefined &&
  query.meta?.suppressGlobalErrorToast !== true;

const shouldShowMutationErrorToast = (mutation: {
  meta?: Record<string, unknown>;
}) => mutation.meta?.toastOnError === true;

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (!shouldShowQueryErrorToast(query)) {
        return;
      }

      pushToast({
        tone: "warning",
        title: "This view could not refresh cleanly",
        description: getErrorMessage(
          error,
          isBrowserOffline()
            ? "You appear to be offline, so we kept the last successful data on screen."
            : "We kept the last successful data on screen while the retry rules ran."
        )
      });
    }
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (!shouldShowMutationErrorToast(mutation)) {
        return;
      }

      pushToast({
        tone: "danger",
        title:
          typeof mutation.meta?.toastTitle === "string"
            ? mutation.meta.toastTitle
            : "We could not finish that action",
        description: getErrorMessage(error)
      });
    }
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: shouldRetryRequest,
      retryDelay: (attemptIndex) =>
        Math.min(1000 * 2 ** Math.max(attemptIndex - 1, 0), 4000),
      staleTime: 1000 * 30
    },
    mutations: {
      retry: 0
    }
  }
});
