import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const envExamplePath = path.resolve(process.cwd(), ".env.example");
const envSchemaPath = path.resolve(process.cwd(), "src/config/env.schema.js");

const schemaKeyPattern = /^\s+([A-Z][A-Z0-9_]+):/gm;
const envExampleKeyPattern = /^([A-Z][A-Z0-9_]+)=/gm;

const extraOperationalKeys = [
  "SEEDS",
  "ADMIN_BOOTSTRAP_EMAIL",
  "ADMIN_BOOTSTRAP_PASSWORD",
  "ADMIN_ROTATE_EMAIL",
  "ADMIN_ROTATE_PASSWORD",
  "SAMPLE_SEED_ENABLED",
  "SAMPLE_SEED_SOURCE_PATH",
];

describe(".env.example", () => {
  it("documents every validated config key and local seed/bootstrap variable", () => {
    const schemaSource = fs.readFileSync(envSchemaPath, "utf8");
    const envExampleSource = fs.readFileSync(envExamplePath, "utf8");

    const schemaKeys = [...schemaSource.matchAll(schemaKeyPattern)].map(
      (match) => match[1],
    );
    const envExampleKeys = new Set(
      [...envExampleSource.matchAll(envExampleKeyPattern)].map(
        (match) => match[1],
      ),
    );
    const expectedKeys = [...schemaKeys, ...extraOperationalKeys];
    const missing = expectedKeys.filter((key) => !envExampleKeys.has(key));

    expect(missing).toEqual([]);
  });

  it("defaults local integration values for Swagger and common frontend origins", () => {
    const envExampleSource = fs.readFileSync(envExamplePath, "utf8");

    expect(envExampleSource).toContain(
      "OPENAPI_SERVER_URL=http://localhost:4000/api/v1",
    );
    expect(envExampleSource).toContain(
      "CORS_ORIGIN=http://localhost:3000,http://localhost:5173",
    );
  });
});
