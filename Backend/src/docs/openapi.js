import swaggerJSDoc from "swagger-jsdoc";

import { createOpenApiBaseDefinition } from "./openapi.base.js";
import {
  generateAutoRoutePathDefinitions,
  mergeOpenApiPaths,
} from "./openapi.route-coverage.js";

const tags = [
  { name: "Health" },
  { name: "Auth" },
  { name: "Users" },
  { name: "Subscriptions" },
  { name: "Payments" },
  { name: "Charities" },
  { name: "Scores" },
  { name: "Draws" },
  { name: "Winners" },
  { name: "Notifications" },
  { name: "Admin" },
  { name: "Reports" },
];

const baseSpec = swaggerJSDoc({
  definition: {
    ...createOpenApiBaseDefinition(),
    tags,
  },
  apis: ["./src/routes/*.js", "./src/components/**/*.routes.js"],
});

const autoRoutePaths = generateAutoRoutePathDefinitions(baseSpec.paths || {});

export const openApiSpec = {
  ...baseSpec,
  paths: mergeOpenApiPaths(baseSpec.paths || {}, autoRoutePaths),
};
