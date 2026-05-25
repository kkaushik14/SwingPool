import swaggerUi from "swagger-ui-express";

import { config } from "../config/index.js";

import { openApiSpec } from "./openapi.js";

export const setupSwagger = (app) => {
  if (!config.openapi.enabled) {
    return;
  }

  app.get("/api-docs.json", (_req, res) => {
    res.json(openApiSpec);
  });

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, { explorer: true }),
  );
};
