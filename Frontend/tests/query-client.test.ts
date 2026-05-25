import { describe, expect, it } from "vitest";

import { isRetryableRequestError, shouldRetryRequest } from "@/lib";
import { ApiRequestError } from "@/types";

const createApiError = (statusCode: number) =>
  new ApiRequestError({
    message: `Status ${statusCode}`,
    statusCode
  });

describe("query retry semantics", () => {
  it("retries network and transient backend failures", () => {
    expect(isRetryableRequestError(createApiError(0))).toBe(true);
    expect(isRetryableRequestError(createApiError(408))).toBe(true);
    expect(isRetryableRequestError(createApiError(429))).toBe(true);
    expect(isRetryableRequestError(createApiError(503))).toBe(true);
  });

  it("does not retry stable client-side failures", () => {
    expect(isRetryableRequestError(createApiError(400))).toBe(false);
    expect(isRetryableRequestError(createApiError(401))).toBe(false);
    expect(isRetryableRequestError(createApiError(403))).toBe(false);
    expect(isRetryableRequestError(createApiError(404))).toBe(false);
    expect(isRetryableRequestError(createApiError(422))).toBe(false);
  });

  it("caps retries after the configured threshold", () => {
    expect(shouldRetryRequest(0, createApiError(503))).toBe(true);
    expect(shouldRetryRequest(1, createApiError(503))).toBe(true);
    expect(shouldRetryRequest(2, createApiError(503))).toBe(false);
  });
});
