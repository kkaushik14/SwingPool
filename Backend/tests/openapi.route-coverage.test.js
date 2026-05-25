import { describe, expect, it } from "vitest";

import { openApiSpec } from "../src/docs/openapi.js";
import { discoverRouteDefinitions } from "../src/docs/openapi.route-coverage.js";

describe("OpenAPI Route Coverage", () => {
  it("covers every registered express route with a documented OpenAPI path+method", () => {
    const discoveredRoutes = discoverRouteDefinitions();
    const missing = [];

    for (const route of discoveredRoutes) {
      const pathObject = openApiSpec.paths?.[route.fullPath];
      const operation = pathObject?.[route.method];

      if (!operation) {
        missing.push(`${route.method.toUpperCase()} ${route.fullPath}`);
      }
    }

    expect(missing).toEqual([]);
  });
});
