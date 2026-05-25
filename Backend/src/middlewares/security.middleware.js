import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import { config } from "../config/index.js";
import { ERROR_CODES } from "../errors/index.js";

import { idempotencyMiddleware } from "./idempotency.middleware.js";
import { sanitizeInputMiddleware } from "./sanitize-input.middleware.js";

const getCorsOrigin = () => {
  if (config.security.cors.origins === "*") {
    return true;
  }

  const allowedOrigins = new Set(config.security.cors.origins);

  return (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback({
      message: "CORS origin is not allowed.",
      statusCode: 403,
      code: ERROR_CODES.FORBIDDEN,
    });
  };
};

const STRIPE_WEBHOOK_PATH_FRAGMENT = "/payments/webhooks/stripe";

const shouldParseJsonBody = (req) => {
  const requestUrl = req.originalUrl || req.url || "";

  if (requestUrl.includes(STRIPE_WEBHOOK_PATH_FRAGMENT)) {
    return false;
  }

  return req.is("application/json") || req.is("application/*+json");
};

export const applySecurityMiddlewares = (app) => {
  app.use(helmet(config.security.helmet));

  app.use(
    cors({
      origin: getCorsOrigin(),
      credentials: config.security.cors.credentials,
      methods: config.security.cors.methods,
      allowedHeaders: config.security.cors.allowedHeaders,
    }),
  );

  if (config.security.compression.enabled) {
    app.use(compression());
  }

  app.use(
    rateLimit({
      windowMs: config.security.rateLimit.windowMs,
      max: config.security.rateLimit.max,
      standardHeaders: config.security.rateLimit.standardHeaders,
      legacyHeaders: config.security.rateLimit.legacyHeaders,
    }),
  );

  app.use(
    express.json({
      limit: config.server.requestJsonLimit,
      type: shouldParseJsonBody,
    }),
  );
  app.use(
    express.urlencoded({
      limit: config.server.requestUrlEncodedLimit,
      extended: true,
    }),
  );

  app.use(sanitizeInputMiddleware());
  app.use(idempotencyMiddleware);
};
