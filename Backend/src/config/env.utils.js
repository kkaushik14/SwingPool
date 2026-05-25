import { z } from "zod";

const truthyValues = new Set(["1", "true", "yes", "on"]);
const falsyValues = new Set(["0", "false", "no", "off"]);

export const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (truthyValues.has(normalized)) {
      return true;
    }

    if (falsyValues.has(normalized)) {
      return false;
    }
  }

  return value;
}, z.boolean());

export const csvStringToArray = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}, z.array(z.string()));

export const intFromEnv = (fallback, { min, max } = {}) => {
  let numericSchema = z.number().int();

  if (typeof min === "number") {
    numericSchema = numericSchema.min(min);
  }

  if (typeof max === "number") {
    numericSchema = numericSchema.max(max);
  }

  return z
    .preprocess((value) => {
      if (value === undefined || value === null || value === "") {
        return fallback;
      }

      if (typeof value === "number") {
        return Math.trunc(value);
      }

      if (typeof value === "string") {
        return Number.parseInt(value, 10);
      }

      return value;
    }, numericSchema)
    .default(fallback);
};
