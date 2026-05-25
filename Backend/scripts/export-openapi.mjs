import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import prettier from "prettier";

import { openApiSpec } from "../src/docs/openapi.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const outputPath = path.resolve(projectRoot, "docs/openapi.json");

const json = JSON.stringify(openApiSpec);
const formatted = await prettier.format(json, { parser: "json" });

fs.writeFileSync(outputPath, formatted);

// eslint-disable-next-line no-console
console.log(`OpenAPI spec exported to ${outputPath}`);
