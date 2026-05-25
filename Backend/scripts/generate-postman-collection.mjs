import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import prettier from "prettier";

import { openApiSpec } from "../src/docs/openapi.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const toPostmanPath = (openApiPath) => {
  return openApiPath.replace(/\{([A-Za-z0-9_]+)\}/g, "{{$1}}");
};

const capitalize = (value) => {
  return String(value || "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const toFolderName = (openApiPath, tags = []) => {
  if (tags.length > 0) {
    return tags[0];
  }

  const firstSegment = openApiPath.split("/").filter(Boolean)[0];
  return capitalize(firstSegment || "General");
};

const buildRequestItem = ({ pathName, method, operation }) => {
  const postmanPath = toPostmanPath(pathName);
  const needsAuth = Array.isArray(operation?.security)
    ? operation.security.some((item) =>
        Object.keys(item).includes("BearerAuth"),
      )
    : false;

  const item = {
    name: `${method.toUpperCase()} ${pathName}`,
    request: {
      method: method.toUpperCase(),
      header: [
        {
          key: "Accept",
          value: "application/json",
        },
      ],
      url: {
        raw: `{{baseUrl}}${postmanPath}`,
        host: ["{{baseUrl}}"],
        path: postmanPath.replace(/^\//, "").split("/"),
      },
      description: operation?.description || operation?.summary || "",
    },
    response: [],
  };

  if (["POST", "PUT", "PATCH"].includes(item.request.method)) {
    item.request.header.push({
      key: "Content-Type",
      value: "application/json",
    });
    item.request.body = {
      mode: "raw",
      raw: '{\n  "example": true\n}',
    };
  }

  if (needsAuth) {
    item.request.auth = {
      type: "bearer",
      bearer: [
        {
          key: "token",
          value: "{{accessToken}}",
          type: "string",
        },
      ],
    };
  }

  return item;
};

const buildCollection = () => {
  const folderMap = new Map();
  const paths = openApiSpec.paths || {};

  for (const pathName of Object.keys(paths).sort()) {
    const pathItem = paths[pathName] || {};

    for (const method of Object.keys(pathItem)) {
      const operation = pathItem[method];
      const folderName = toFolderName(pathName, operation?.tags || []);

      if (!folderMap.has(folderName)) {
        folderMap.set(folderName, []);
      }

      folderMap.get(folderName).push(
        buildRequestItem({
          pathName,
          method,
          operation,
        }),
      );
    }
  }

  return {
    info: {
      name: "Swing Pool Backend API",
      description:
        "Auto-generated Postman collection from backend OpenAPI specification.",
      schema:
        "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: [...folderMap.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([folderName, items]) => ({
        name: folderName,
        item: items.sort((left, right) => left.name.localeCompare(right.name)),
      })),
    variable: [
      {
        key: "baseUrl",
        value: "http://localhost:4000/api/v1",
      },
      {
        key: "accessToken",
        value: "",
      },
    ],
  };
};

const writeCollection = async () => {
  const collection = buildCollection();
  const outputDir = path.resolve(projectRoot, "docs/postman");
  const outputPath = path.resolve(
    outputDir,
    "Swing-Pool-Backend.postman_collection.json",
  );

  fs.mkdirSync(outputDir, { recursive: true });
  const json = JSON.stringify(collection);
  const formatted = await prettier.format(json, {
    parser: "json",
  });
  fs.writeFileSync(outputPath, formatted);

  // eslint-disable-next-line no-console
  console.log(`Postman collection generated at ${outputPath}`);
};

await writeCollection();
