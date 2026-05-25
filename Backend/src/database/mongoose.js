import mongoose from "mongoose";

import { config } from "../config/index.js";
import { logger } from "../logger/index.js";

let isDatabaseConnected = false;

export const redactMongoUri = (uri = "") => {
  const raw = String(uri || "");

  if (!raw) {
    return raw;
  }

  try {
    const parsed = new URL(raw);

    if (parsed.username) {
      parsed.username = "***";
    }

    if (parsed.password) {
      parsed.password = "***";
    }

    return parsed.toString();
  } catch (_error) {
    return raw.replace(/\/\/[^@]+@/, "//***:***@");
  }
};

const waitForRetry = async (attempt) => {
  const baseDelay = config.database.retryDelayMs * 2 ** (attempt - 1);
  const cappedDelay = Math.min(baseDelay, config.database.retryMaxDelayMs);
  const jitter = Math.floor(Math.random() * 250);
  const delay = cappedDelay + jitter;

  await new Promise((resolve) => setTimeout(resolve, delay));
};

const connectOnce = async () => {
  await mongoose.connect(config.database.uri, {
    maxPoolSize: config.database.maxPoolSize,
    serverSelectionTimeoutMS: config.database.serverSelectionTimeoutMs,
  });
};

export const connectDatabase = async () => {
  if (config.database.skipConnection) {
    logger.warn("Skipping MongoDB connection because SKIP_DB_CONNECTION=true");
    return false;
  }

  if (isDatabaseConnected) {
    return true;
  }

  let lastError;

  for (
    let attempt = 1;
    attempt <= config.database.retryAttempts;
    attempt += 1
  ) {
    try {
      await connectOnce();
      isDatabaseConnected = true;
      logger.info(
        { mongoUri: redactMongoUri(config.database.uri), attempt },
        "Connected to MongoDB",
      );
      return true;
    } catch (error) {
      lastError = error;

      logger.warn(
        {
          attempt,
          retryAttempts: config.database.retryAttempts,
          message: error.message,
        },
        "MongoDB connection attempt failed",
      );

      const hasAttemptsLeft = attempt < config.database.retryAttempts;

      if (!hasAttemptsLeft) {
        break;
      }

      await waitForRetry(attempt);
    }
  }

  if (config.isProduction) {
    logger.error(
      { error: lastError?.message },
      "Unable to connect to MongoDB after retries",
    );
    throw lastError;
  }

  logger.warn("Continuing startup without MongoDB in non-production mode");
  return false;
};

export const disconnectDatabase = async () => {
  if (!isDatabaseConnected) {
    return;
  }

  await mongoose.disconnect();
  isDatabaseConnected = false;
  logger.info("Disconnected from MongoDB");
};

export const databaseHealth = () => ({
  connected: isDatabaseConnected,
  readyState: mongoose.connection.readyState,
});
