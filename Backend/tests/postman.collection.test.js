import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { openApiSpec } from "../src/docs/openapi.js";

const postmanCollectionPath = path.resolve(
  process.cwd(),
  "docs/postman/Swing-Pool-Backend.postman_collection.json",
);

const flattenItems = (items = []) => {
  return items.flatMap((item) => {
    return item.item ? flattenItems(item.item) : [item];
  });
};

const toOpenApiKey = ({ method, pathName }) => {
  return `${method.toLowerCase()} ${pathName}`;
};

const toPostmanKey = (item) => {
  return `${item.request.method.toLowerCase()} ${item.request.url.raw
    .replace("{{baseUrl}}", "")
    .replace(/\{\{([A-Za-z0-9_]+)\}\}/g, "{$1}")}`;
};

describe("Postman Collection", () => {
  it("contains every documented OpenAPI operation", () => {
    const postmanCollection = JSON.parse(
      fs.readFileSync(postmanCollectionPath, "utf8"),
    );
    const requests = flattenItems(postmanCollection.item || []);
    const postmanKeys = new Set(requests.map(toPostmanKey));
    const openApiKeys = [];

    for (const [pathName, pathItem] of Object.entries(
      openApiSpec.paths || {},
    )) {
      for (const method of Object.keys(pathItem)) {
        openApiKeys.push(
          toOpenApiKey({
            method,
            pathName,
          }),
        );
      }
    }

    const missing = openApiKeys.filter((key) => !postmanKeys.has(key));

    expect(requests).toHaveLength(openApiKeys.length);
    expect(missing).toEqual([]);
  });

  it("ships with the local backend base URL variable expected by the frontend", () => {
    const postmanCollection = JSON.parse(
      fs.readFileSync(postmanCollectionPath, "utf8"),
    );
    const baseUrlVariable = (postmanCollection.variable || []).find(
      (item) => item.key === "baseUrl",
    );

    expect(baseUrlVariable?.value).toBe("http://localhost:4000/api/v1");
  });
});
