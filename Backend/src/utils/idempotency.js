import { IDEMPOTENCY_KEY_HEADER } from "../constants/index.js";

export const normalizeIdempotencyKey = (key) => {
  if (!key) {
    return "";
  }

  return String(key).trim();
};

export const hasIdempotencyKey = (request) => {
  return Boolean(normalizeIdempotencyKey(request.get(IDEMPOTENCY_KEY_HEADER)));
};
