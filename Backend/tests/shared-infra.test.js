import { describe, expect, it } from "vitest";

import { ERROR_CODES } from "../src/errors/index.js";
import { idempotencyService } from "../src/services/index.js";
import {
  addMoney,
  buildErrorResponse,
  buildMongoFilters,
  buildPaginationMeta,
  computeHmacSignature,
  endOfISTDay,
  fromMinorUnits,
  parseDurationToMilliseconds,
  resolvePagination,
  resolveSorting,
  startOfISTDay,
  toISTDateTimeString,
  toMinorUnits,
  verifyHmacSignature,
} from "../src/utils/index.js";

describe("Shared Infrastructure Helpers", () => {
  it("builds pagination payload and metadata", () => {
    const pagination = resolvePagination({ page: 2, pageSize: 10 });
    const meta = buildPaginationMeta({
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems: 47,
    });

    expect(pagination.skip).toBe(10);
    expect(meta.totalPages).toBe(5);
    expect(meta.hasNextPage).toBe(true);
  });

  it("builds sorting descriptor", () => {
    const sorting = resolveSorting(
      { sortBy: "createdAt", sortOrder: "asc" },
      { allowedFields: ["createdAt", "email"] },
    );

    expect(sorting.mongoSort).toEqual({ createdAt: 1 });
  });

  it("builds filtering object for Mongo usage", () => {
    const filters = buildMongoFilters(
      { search: "swing", minAmount: 200 },
      {
        search: { field: "name", allowRegex: true },
        minAmount: {
          field: "amount",
          operator: "$gte",
          transform: (value) => Number(value),
        },
      },
    );

    expect(filters).toEqual({
      name: {
        $options: "i",
        $regex: "swing",
      },
      amount: {
        $gte: 200,
      },
    });
  });

  it("handles IST date helpers", () => {
    const date = new Date("2026-04-22T12:34:56.000Z");
    const formatted = toISTDateTimeString(date);
    const start = startOfISTDay(date);
    const end = endOfISTDay(date);

    expect(typeof formatted).toBe("string");
    expect(start.getTime()).toBeLessThanOrEqual(date.getTime());
    expect(end.getTime()).toBeGreaterThanOrEqual(date.getTime());
  });

  it("performs safe money math with decimals", () => {
    expect(addMoney("0.1", "0.2")).toBe("0.30");
    expect(toMinorUnits("10.55")).toBe(1055);
    expect(fromMinorUnits(1055)).toBe("10.55");
  });

  it("parses duration strings into milliseconds", () => {
    expect(parseDurationToMilliseconds("30s")).toBe(30_000);
    expect(parseDurationToMilliseconds("15m")).toBe(900_000);
    expect(parseDurationToMilliseconds("2h")).toBe(7_200_000);
    expect(parseDurationToMilliseconds("7d")).toBe(604_800_000);
    expect(parseDurationToMilliseconds("invalid")).toBe(0);
  });

  it("supports idempotency reservation and replay lifecycle", () => {
    const requestHash = idempotencyService.buildRequestHash({
      body: { amount: 5000 },
    });

    const first = idempotencyService.reserve({
      scope: "POST:/payments:int-1",
      key: "abc-123",
      requestHash,
    });

    expect(first.created).toBe(true);

    idempotencyService.complete({
      scope: "POST:/payments:int-1",
      key: "abc-123",
      response: { statusCode: 201, body: { ok: true } },
    });

    const replay = idempotencyService.get({
      scope: "POST:/payments:int-1",
      key: "abc-123",
    });

    expect(replay.status).toBe("completed");
    expect(replay.response.statusCode).toBe(201);
  });

  it("creates and verifies webhook HMAC signature", () => {
    const payload = JSON.stringify({ event: "payment.created" });
    const signature = computeHmacSignature(payload, "secret-key");

    expect(
      verifyHmacSignature({ payload, signature, secret: "secret-key" }),
    ).toBe(true);
    expect(
      verifyHmacSignature({
        payload,
        signature: "invalid",
        secret: "secret-key",
      }),
    ).toBe(false);
  });

  it("builds standard error response contract", () => {
    const response = buildErrorResponse({
      message: "Validation failed",
      code: ERROR_CODES.VALIDATION_ERROR,
      details: { field: "email" },
      requestId: "req-1",
    });

    expect(response.success).toBe(false);
    expect(response.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(response.requestId).toBe("req-1");
  });
});
