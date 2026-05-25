import pinoHttp from "pino-http";

import { REQUEST_ID_HEADER } from "../constants/index.js";
import { logger } from "./logger.js";

export const httpLoggerMiddleware = pinoHttp({
  logger,
  genReqId: (req, res) => req.requestId || res.getHeader(REQUEST_ID_HEADER),
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res, error) =>
    `${req.method} ${req.url} failed: ${error.message}`,
  customLogLevel: (_req, res, error) => {
    if (error || res.statusCode >= 500) {
      return "error";
    }

    if (res.statusCode >= 400) {
      return "warn";
    }

    return "info";
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      remoteAddress: req.socket?.remoteAddress,
      userId: req.auth?.sub || null,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});
