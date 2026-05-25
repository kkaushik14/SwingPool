import { ValidationError } from "../errors/index.js";
import { config } from "../config/index.js";

const PROHIBITED_KEYS = new Set(["__proto__", "prototype", "constructor"]);

const isPlainObject = (value) => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

const sanitizeString = (value) => value.replace(/\u0000/g, "").trim();

const replaceCollectionContents = (target, source) => {
  if (Array.isArray(target) && Array.isArray(source)) {
    target.splice(0, target.length, ...source);
    return target;
  }

  if (isPlainObject(target) && isPlainObject(source)) {
    for (const key of Object.keys(target)) {
      delete target[key];
    }

    Object.assign(target, source);
    return target;
  }

  return source;
};

const sanitizeObject = (value, depth, maxDepth) => {
  if (depth > maxDepth) {
    throw new ValidationError("Request payload nesting is too deep.");
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1, maxDepth));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const output = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    if (PROHIBITED_KEYS.has(key) || key.startsWith("$") || key.includes(".")) {
      continue;
    }

    output[key] = sanitizeValue(nestedValue, depth + 1, maxDepth);
  }

  return output;
};

const sanitizeValue = (value, depth, maxDepth) => {
  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (Array.isArray(value) || isPlainObject(value)) {
    return sanitizeObject(value, depth, maxDepth);
  }

  return value;
};

export const sanitizeInputMiddleware = () => {
  return (req, _res, next) => {
    if (!config.security.sanitizeInput.enabled) {
      return next();
    }

    try {
      const maxDepth = config.security.sanitizeInput.maxDepth;
      const sanitizedBody = sanitizeValue(req.body, 0, maxDepth);
      const sanitizedQuery = sanitizeValue(req.query, 0, maxDepth);
      const sanitizedParams = sanitizeValue(req.params, 0, maxDepth);

      req.body = replaceCollectionContents(req.body, sanitizedBody);
      replaceCollectionContents(req.query, sanitizedQuery);
      replaceCollectionContents(req.params, sanitizedParams);

      return next();
    } catch (error) {
      return next(error);
    }
  };
};
