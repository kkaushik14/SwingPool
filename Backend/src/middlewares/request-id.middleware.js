import { randomUUID } from "node:crypto";

import { REQUEST_ID_HEADER } from "../constants/index.js";

export const requestIdMiddleware = (req, res, next) => {
  const incomingRequestId = req.get(REQUEST_ID_HEADER);
  const requestId = incomingRequestId || randomUUID();

  req.requestId = requestId;
  res.locals.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  next();
};
