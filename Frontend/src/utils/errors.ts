import { ApiRequestError, type ApiErrorResponse } from "@/types";

export const toApiRequestError = ({
  statusCode,
  payload,
  fallbackMessage
}: {
  statusCode: number;
  payload?: ApiErrorResponse | null;
  fallbackMessage?: string;
}) => {
  return new ApiRequestError({
    statusCode,
    message: payload?.message || fallbackMessage || "Something went wrong.",
    code: payload?.error?.code,
    details: payload?.error?.details,
    requestId: payload?.requestId
  });
};

export const getErrorMessage = (error: unknown, fallback = "Something went wrong.") => {
  if (error instanceof ApiRequestError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};
