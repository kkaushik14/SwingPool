import { StatusCodes } from "http-status-codes";

const currentTimestamp = () => new Date().toISOString();

export const buildSuccessResponse = ({
  message = "Request completed successfully.",
  data = null,
  meta = null,
  requestId = null,
}) => {
  const response = {
    success: true,
    message,
    data,
    requestId,
    timestamp: currentTimestamp(),
  };

  if (meta) {
    response.meta = meta;
  }

  return response;
};

export const buildErrorResponse = ({
  message,
  code,
  details = null,
  requestId = null,
}) => {
  return {
    success: false,
    message,
    error: {
      code,
      details,
    },
    requestId,
    timestamp: currentTimestamp(),
  };
};

export const sendSuccess = (
  res,
  {
    statusCode = StatusCodes.OK,
    message = "Request completed successfully.",
    data = null,
    meta = null,
  } = {},
) => {
  return res.status(statusCode).json(
    buildSuccessResponse({
      message,
      data,
      meta,
      requestId: res.locals.requestId || null,
    }),
  );
};

export const sendError = (res, { statusCode, message, code, details }) => {
  return res.status(statusCode).json(
    buildErrorResponse({
      message,
      code,
      details: details || null,
      requestId: res.locals.requestId || null,
    }),
  );
};
