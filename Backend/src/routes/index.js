import { config } from "../config/index.js";
import { SUCCESS_MESSAGES } from "../constants/index.js";
import { setupSwagger } from "../docs/index.js";
import { sendSuccess } from "../utils/index.js";

import { v1Router } from "./v1.route.js";

export const registerRoutes = (app) => {
  setupSwagger(app);

  app.get("/", (_req, res) => {
    return sendSuccess(res, {
      message: SUCCESS_MESSAGES.DEFAULT,
      data: {
        name: "Swing Pool Backend",
        docs: "/api-docs",
        versionedBasePath: `${config.server.apiPrefix}/${config.server.apiVersion}`,
      },
    });
  });

  app.use(`${config.server.apiPrefix}/${config.server.apiVersion}`, v1Router);
};
