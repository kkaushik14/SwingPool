import { env } from "./env.js";
import {
  developmentConfig,
  productionConfig,
  testConfig,
} from "./environments/index.js";
import { deepFreeze, mergeConfig } from "./merge-config.js";
import { parseDurationToMilliseconds } from "../utils/duration.js";

const parseCorsOrigins = (corsOriginConfig) => {
  if (corsOriginConfig === "*") {
    return "*";
  }

  return corsOriginConfig
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const parseMethods = (methods) => {
  if (Array.isArray(methods)) {
    return methods.map((method) => method.toUpperCase());
  }

  return ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
};

const baseConfig = {
  appName: "Swing Pool API",
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",
  timezone: env.TZ,
  server: {
    host: env.HOST,
    port: env.PORT,
    apiPrefix: env.API_PREFIX,
    apiVersion: env.API_VERSION,
    shutdownTimeoutMs: env.SHUTDOWN_TIMEOUT_MS,
    requestJsonLimit: env.REQUEST_JSON_LIMIT,
    requestUrlEncodedLimit: env.REQUEST_URLENCODED_LIMIT,
    trustProxy: env.TRUST_PROXY,
  },
  database: {
    uri: env.MONGODB_URI,
    maxPoolSize: env.MONGODB_MAX_POOL_SIZE,
    serverSelectionTimeoutMs: env.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
    retryAttempts: env.MONGODB_RETRY_ATTEMPTS,
    retryDelayMs: env.MONGODB_RETRY_DELAY_MS,
    retryMaxDelayMs: env.MONGODB_RETRY_MAX_DELAY_MS,
    skipConnection: env.SKIP_DB_CONNECTION,
  },
  auth: {
    jwtSecret: env.JWT_SECRET,
    accessTokenExpiresIn: env.JWT_EXPIRES_IN,
    accessTokenExpiresInMs: parseDurationToMilliseconds(env.JWT_EXPIRES_IN),
    refreshTokenSecret: env.JWT_REFRESH_SECRET,
    refreshTokenExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    refreshTokenExpiresInMs: parseDurationToMilliseconds(
      env.JWT_REFRESH_EXPIRES_IN,
    ),
    emailVerificationTokenExpiresIn:
      env.AUTH_EMAIL_VERIFICATION_TOKEN_EXPIRES_IN,
    emailVerificationTokenExpiresInMs: parseDurationToMilliseconds(
      env.AUTH_EMAIL_VERIFICATION_TOKEN_EXPIRES_IN,
    ),
    passwordResetTokenExpiresIn: env.AUTH_PASSWORD_RESET_TOKEN_EXPIRES_IN,
    passwordResetTokenExpiresInMs: parseDurationToMilliseconds(
      env.AUTH_PASSWORD_RESET_TOKEN_EXPIRES_IN,
    ),
  },
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    webhookToleranceSeconds: env.STRIPE_WEBHOOK_TOLERANCE_SECONDS,
    webhookProcessingTimeoutMs: env.STRIPE_WEBHOOK_PROCESSING_TIMEOUT_MS,
    mockMode: env.STRIPE_MOCK_MODE,
  },
  payments: {
    attemptTimeoutMinutes: env.PAYMENT_ATTEMPT_TIMEOUT_MINUTES,
  },
  notifications: {
    emailProvider: env.NOTIFICATIONS_EMAIL_PROVIDER,
    smsProvider: env.NOTIFICATIONS_SMS_PROVIDER,
    fromEmail: env.NOTIFICATIONS_FROM_EMAIL,
    fromSms: env.NOTIFICATIONS_FROM_SMS,
  },
  jobs: {
    enabled: env.JOBS_ENABLED,
    renewalReminderIntervalMs: env.JOBS_RENEWAL_REMINDER_INTERVAL_MS,
    gracePeriodCheckIntervalMs: env.JOBS_GRACE_PERIOD_CHECK_INTERVAL_MS,
    expiryEnforcementIntervalMs: env.JOBS_EXPIRY_ENFORCEMENT_INTERVAL_MS,
    monthlyDrawPreparationIntervalMs: env.JOBS_MONTHLY_DRAW_PREP_INTERVAL_MS,
    drawExecutionIntervalMs: env.JOBS_DRAW_EXECUTION_INTERVAL_MS,
    winnerProofCheckIntervalMs: env.JOBS_WINNER_PROOF_CHECK_INTERVAL_MS,
    paymentReconciliationIntervalMs:
      env.JOBS_PAYMENT_RECONCILIATION_INTERVAL_MS,
    renewalReminderLeadDays: env.JOBS_RENEWAL_REMINDER_LEAD_DAYS,
    graceWarningLeadDays: env.JOBS_GRACE_WARNING_LEAD_DAYS,
    paymentReconciliationLookbackMinutes:
      env.JOBS_PAYMENT_RECONCILIATION_LOOKBACK_MINUTES,
    paymentReconciliationBatchSize: env.JOBS_PAYMENT_RECONCILIATION_BATCH_SIZE,
  },
  subscription: {
    gracePeriodDays: env.SUBSCRIPTION_GRACE_PERIOD_DAYS,
    mandatoryCharityPercentage: env.SUBSCRIPTION_MANDATORY_CHARITY_PERCENTAGE,
    currency: "INR",
  },
  charity: {
    defaultCurrency: env.CHARITY_DEFAULT_CURRENCY,
    gatewayFeePercentage: env.CHARITY_GATEWAY_FEE_PERCENTAGE,
    prizePoolPercentage: env.CHARITY_PRIZE_POOL_PERCENTAGE,
    mandatoryCharityPercentage: env.CHARITY_MANDATORY_PERCENTAGE,
  },
  security: {
    cors: {
      origins: parseCorsOrigins(env.CORS_ORIGIN),
      methods: parseMethods(env.CORS_ALLOWED_METHODS),
      allowedHeaders: env.CORS_ALLOWED_HEADERS,
      credentials: true,
    },
    helmet: {
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    },
    compression: {
      enabled: true,
    },
    sanitizeInput: {
      enabled: true,
      maxDepth: 10,
    },
    rateLimit: {
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    },
    idempotency: {
      enabled: env.IDEMPOTENCY_ENABLED,
      ttlSeconds: env.IDEMPOTENCY_TTL_SECONDS,
      methods: parseMethods(env.IDEMPOTENCY_REQUIRED_METHODS),
      headerName: "idempotency-key",
    },
  },
  logging: {
    level: env.LOG_LEVEL,
    prettyPrint: false,
  },
  openapi: {
    enabled: env.OPENAPI_ENABLED,
    serverUrl: env.OPENAPI_SERVER_URL,
  },
};

const environmentConfigMap = {
  development: developmentConfig,
  test: testConfig,
  production: productionConfig,
};

const environmentOverrides =
  environmentConfigMap[env.NODE_ENV] || developmentConfig;

export const config = deepFreeze(mergeConfig(baseConfig, environmentOverrides));
