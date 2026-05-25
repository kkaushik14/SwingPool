import { z } from "zod";

import { booleanFromEnv, csvStringToArray, intFromEnv } from "./env.utils.js";

const durationPattern = /^\d+[smhd]$/i;

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    HOST: z.string().default("0.0.0.0"),
    PORT: intFromEnv(4000, { min: 1 }),
    API_PREFIX: z.string().default("/api"),
    API_VERSION: z.string().default("v1"),
    SHUTDOWN_TIMEOUT_MS: intFromEnv(15000, { min: 1 }),

    MONGODB_URI: z
      .string()
      .min(1)
      .default("mongodb://127.0.0.1:27017/swing-pool"),
    MONGODB_MAX_POOL_SIZE: intFromEnv(10, { min: 1 }),
    MONGODB_SERVER_SELECTION_TIMEOUT_MS: intFromEnv(5000, { min: 1 }),
    MONGODB_RETRY_ATTEMPTS: intFromEnv(5, { min: 1 }),
    MONGODB_RETRY_DELAY_MS: intFromEnv(1000, { min: 1 }),
    MONGODB_RETRY_MAX_DELAY_MS: intFromEnv(15000, { min: 1 }),
    SKIP_DB_CONNECTION: booleanFromEnv.default(false),

    JWT_SECRET: z
      .string()
      .min(16)
      .default("replace-this-with-a-secure-jwt-secret"),
    JWT_EXPIRES_IN: z.string().regex(durationPattern).default("1d"),
    JWT_REFRESH_SECRET: z
      .string()
      .min(16)
      .default("replace-this-with-a-secure-refresh-secret"),
    JWT_REFRESH_EXPIRES_IN: z.string().regex(durationPattern).default("7d"),
    AUTH_EMAIL_VERIFICATION_TOKEN_EXPIRES_IN: z
      .string()
      .regex(durationPattern)
      .default("24h"),
    AUTH_PASSWORD_RESET_TOKEN_EXPIRES_IN: z
      .string()
      .regex(durationPattern)
      .default("1h"),
    SUBSCRIPTION_GRACE_PERIOD_DAYS: intFromEnv(7, { min: 1 }),
    SUBSCRIPTION_MANDATORY_CHARITY_PERCENTAGE: z.coerce
      .number()
      .min(0)
      .max(100)
      .default(10),

    CHARITY_DEFAULT_CURRENCY: z.enum(["INR"]).default("INR"),
    CHARITY_GATEWAY_FEE_PERCENTAGE: z.coerce
      .number()
      .min(0)
      .max(100)
      .default(0),
    CHARITY_PRIZE_POOL_PERCENTAGE: z.coerce
      .number()
      .min(0)
      .max(100)
      .default(35),
    CHARITY_MANDATORY_PERCENTAGE: z.coerce.number().min(0).max(100).default(10),

    RATE_LIMIT_WINDOW_MS: intFromEnv(15 * 60 * 1000, { min: 1 }),
    RATE_LIMIT_MAX: intFromEnv(200, { min: 1 }),
    REQUEST_JSON_LIMIT: z.string().default("1mb"),
    REQUEST_URLENCODED_LIMIT: z.string().default("1mb"),

    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    CORS_ORIGIN: z.string().default("*"),
    CORS_ALLOWED_METHODS: csvStringToArray.default([
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ]),
    CORS_ALLOWED_HEADERS: csvStringToArray.default([
      "Authorization",
      "Content-Type",
      "Idempotency-Key",
      "X-Request-Id",
      "Stripe-Signature",
    ]),
    TRUST_PROXY: booleanFromEnv.default(false),

    STRIPE_SECRET_KEY: z.string().default("sk_test_placeholder_key"),
    STRIPE_WEBHOOK_SECRET: z.string().default("whsec_placeholder_key"),
    STRIPE_WEBHOOK_TOLERANCE_SECONDS: intFromEnv(300, { min: 1 }),
    STRIPE_WEBHOOK_PROCESSING_TIMEOUT_MS: intFromEnv(8000, { min: 500 }),
    STRIPE_MOCK_MODE: booleanFromEnv.default(true),

    PAYMENT_ATTEMPT_TIMEOUT_MINUTES: intFromEnv(30, { min: 1 }),

    NOTIFICATIONS_EMAIL_PROVIDER: z.enum(["log", "noop"]).default("log"),
    NOTIFICATIONS_SMS_PROVIDER: z.enum(["log", "noop"]).default("noop"),
    NOTIFICATIONS_FROM_EMAIL: z
      .string()
      .trim()
      .default("no-reply@swingpool.local"),
    NOTIFICATIONS_FROM_SMS: z.string().trim().default("SWINGPOOL"),

    JOBS_ENABLED: booleanFromEnv.default(true),
    JOBS_RENEWAL_REMINDER_INTERVAL_MS: intFromEnv(30 * 60 * 1000, {
      min: 1000,
    }),
    JOBS_GRACE_PERIOD_CHECK_INTERVAL_MS: intFromEnv(30 * 60 * 1000, {
      min: 1000,
    }),
    JOBS_EXPIRY_ENFORCEMENT_INTERVAL_MS: intFromEnv(30 * 60 * 1000, {
      min: 1000,
    }),
    JOBS_MONTHLY_DRAW_PREP_INTERVAL_MS: intFromEnv(60 * 60 * 1000, {
      min: 1000,
    }),
    JOBS_DRAW_EXECUTION_INTERVAL_MS: intFromEnv(60 * 60 * 1000, {
      min: 1000,
    }),
    JOBS_WINNER_PROOF_CHECK_INTERVAL_MS: intFromEnv(60 * 60 * 1000, {
      min: 1000,
    }),
    JOBS_PAYMENT_RECONCILIATION_INTERVAL_MS: intFromEnv(15 * 60 * 1000, {
      min: 1000,
    }),
    JOBS_RENEWAL_REMINDER_LEAD_DAYS: intFromEnv(3, {
      min: 1,
      max: 30,
    }),
    JOBS_GRACE_WARNING_LEAD_DAYS: intFromEnv(2, {
      min: 1,
      max: 30,
    }),
    JOBS_PAYMENT_RECONCILIATION_LOOKBACK_MINUTES: intFromEnv(30, { min: 1 }),
    JOBS_PAYMENT_RECONCILIATION_BATCH_SIZE: intFromEnv(100, { min: 1 }),

    IDEMPOTENCY_ENABLED: booleanFromEnv.default(true),
    IDEMPOTENCY_TTL_SECONDS: intFromEnv(24 * 60 * 60, { min: 1 }),
    IDEMPOTENCY_REQUIRED_METHODS: csvStringToArray.default([
      "POST",
      "PUT",
      "PATCH",
    ]),

    OPENAPI_ENABLED: booleanFromEnv.default(true),
    OPENAPI_SERVER_URL: z.preprocess(
      (value) => (value === "" || value === undefined ? undefined : value),
      z.string().url().optional(),
    ),

    TZ: z.string().default("Asia/Kolkata"),
  })
  .superRefine((data, ctx) => {
    if (
      data.NODE_ENV === "production" &&
      data.JWT_SECRET.includes("replace-this")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "JWT_SECRET must be set to a secure value in production.",
        path: ["JWT_SECRET"],
      });
    }

    if (
      data.NODE_ENV === "production" &&
      data.JWT_REFRESH_SECRET.includes("replace-this")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "JWT_REFRESH_SECRET must be set to a secure value in production.",
        path: ["JWT_REFRESH_SECRET"],
      });
    }

    if (
      data.NODE_ENV === "production" &&
      data.STRIPE_SECRET_KEY.startsWith("sk_test_")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use a live Stripe key in production environments.",
        path: ["STRIPE_SECRET_KEY"],
      });
    }
  });
