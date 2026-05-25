import express from "express";

import { config } from "../config/index.js";
import {
  applySecurityMiddlewares,
  errorHandlerMiddleware,
  notFoundMiddleware,
  requestIdMiddleware,
} from "../middlewares/index.js";
import { httpLoggerMiddleware } from "../logger/index.js";
import { registerRoutes } from "../routes/index.js";

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");

  if (config.server.trustProxy) {
    app.set("trust proxy", 1);
  }

  app.use(requestIdMiddleware);
  app.use(httpLoggerMiddleware);

  applySecurityMiddlewares(app);

  registerRoutes(app);

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
};
