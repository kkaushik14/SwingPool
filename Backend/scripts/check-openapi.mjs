import { openApiSpec } from "../src/docs/openapi.js";
import { discoverRouteDefinitions } from "../src/docs/openapi.route-coverage.js";

const discoveredRoutes = discoverRouteDefinitions();
const missing = [];

for (const route of discoveredRoutes) {
  const pathItem = openApiSpec.paths?.[route.fullPath];
  const operation = pathItem?.[route.method];

  if (!operation) {
    missing.push(`${route.method.toUpperCase()} ${route.fullPath}`);
  }
}

if (missing.length > 0) {
  // eslint-disable-next-line no-console
  console.error("OpenAPI route coverage is incomplete.");
  // eslint-disable-next-line no-console
  console.error(missing.join("\n"));
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log(
  `OpenAPI coverage check passed for ${discoveredRoutes.length} routes.`,
);
