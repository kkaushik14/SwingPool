import { createHash } from "node:crypto";

import { config } from "../config/index.js";
import { ConflictError, ValidationError } from "../errors/index.js";
import { idempotencyService } from "../services/index.js";

const REPLAY_HEADER = "x-idempotency-replayed";

const isIdempotentMethod = (method) => {
  return config.security.idempotency.methods.includes(method.toUpperCase());
};

const buildActorFingerprint = (req) => {
  const authorizationHeader = req.headers.authorization || "anonymous";

  return createHash("sha1")
    .update(authorizationHeader)
    .digest("hex")
    .slice(0, 12);
};

const buildScope = (req) => {
  return `${req.method}:${req.originalUrl}:${buildActorFingerprint(req)}`;
};

const normalizeBodyFromSend = (body) => {
  if (Buffer.isBuffer(body)) {
    return body.toString("utf8");
  }

  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch (_error) {
      return body;
    }
  }

  return body;
};

export const idempotencyMiddleware = (req, res, next) => {
  if (!config.security.idempotency.enabled || !isIdempotentMethod(req.method)) {
    return next();
  }

  const idempotencyKey = req.get(config.security.idempotency.headerName);

  if (!idempotencyKey) {
    return next();
  }

  if (idempotencyKey.length > 255) {
    return next(
      new ValidationError(
        "Idempotency-Key cannot be longer than 255 characters.",
      ),
    );
  }

  const scope = buildScope(req);
  const requestHash = idempotencyService.buildRequestHash({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  const { created, entry } = idempotencyService.reserve({
    scope,
    key: idempotencyKey,
    requestHash,
  });

  if (!created) {
    if (entry.requestHash !== requestHash) {
      return next(
        new ConflictError(
          "Idempotency key was already used with a different request payload.",
          {
            code: "IDEMPOTENCY_PAYLOAD_MISMATCH",
          },
        ),
      );
    }

    if (entry.status === "in_progress") {
      return next(
        new ConflictError(
          "Another request with the same idempotency key is in progress.",
          {
            code: "IDEMPOTENCY_IN_PROGRESS",
          },
        ),
      );
    }

    if (entry.status === "completed" && entry.response) {
      res.setHeader(REPLAY_HEADER, "true");
      return res.status(entry.response.statusCode).json(entry.response.body);
    }
  }

  let capturedBody = null;

  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = (body) => {
    capturedBody = body;
    return originalJson(body);
  };

  res.send = (body) => {
    if (capturedBody === null) {
      capturedBody = normalizeBodyFromSend(body);
    }

    return originalSend(body);
  };

  res.on("finish", () => {
    if (res.statusCode >= 500) {
      idempotencyService.clear({
        scope,
        key: idempotencyKey,
      });
      return;
    }

    idempotencyService.complete({
      scope,
      key: idempotencyKey,
      response: {
        statusCode: res.statusCode,
        body: capturedBody,
      },
    });
  });

  return next();
};
