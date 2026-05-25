import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { config } from "../config/index.js";
import { SUCCESS_MESSAGES } from "../constants/index.js";
import { databaseHealth } from "../database/index.js";
import { sendSuccess } from "../utils/index.js";

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check endpoint
 *     description: Returns service and process health metadata.
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get("/health", (req, res) => {
  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.HEALTHY,
    data: {
      status: "ok",
      uptimeSeconds: process.uptime(),
      environment: config.env,
      timezone: config.timezone,
      database: databaseHealth(),
    },
  });
});

export { router as healthRouter };
