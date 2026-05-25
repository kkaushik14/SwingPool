import dotenv from "dotenv";

import { envSchema } from "./env.schema.js";

const loadEnvironmentFiles = () => {
  const activeEnvironment = process.env.NODE_ENV || "development";
  const candidates = [
    `.env.${activeEnvironment}.local`,
    ".env.local",
    `.env.${activeEnvironment}`,
    ".env",
  ];

  for (const candidate of candidates) {
    dotenv.config({
      path: candidate,
      override: false,
      quiet: true,
    });
  }
};

loadEnvironmentFiles();

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const flattenedErrors = parsedEnv.error.flatten();
  throw new Error(
    `Environment validation failed: ${JSON.stringify(flattenedErrors.fieldErrors, null, 2)}`,
  );
}

export const env = Object.freeze(parsedEnv.data);
