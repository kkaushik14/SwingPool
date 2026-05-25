import pino from "pino";

import { config } from "../config/index.js";

const redactPaths = [
  "req.headers.authorization",
  "req.headers.cookie",
  "password",
  "*.password",
  "token",
  "*.token",
  "refreshToken",
  "stripeSignature",
];

export const logger = pino({
  level: config.logging.level,
  base: {
    service: "swing-pool-backend",
    environment: config.env,
  },
  redact: {
    paths: redactPaths,
    remove: true,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const createScopedLogger = (scope) => logger.child({ scope });
