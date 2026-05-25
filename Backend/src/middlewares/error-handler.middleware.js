import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";

import { ERROR_MESSAGES } from "../constants/index.js";
import { AppError, ERROR_CODES, ValidationError } from "../errors/index.js";
import { logger } from "../logger/index.js";
import { sendError } from "../utils/index.js";

const toAppError = (error) => {
  if (error instanceof AppError) {
    return error;
  }

  if (error?.statusCode && error?.code) {
    return new AppError({
      message: error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      statusCode: error.statusCode,
      code: error.code,
      details: error.details || null,
      isOperational: true,
    });
  }

  if (error instanceof ZodError) {
    return new ValidationError("Request validation failed.", error.flatten());
  }

  if (error?.name === "ValidationError" && error?.errors) {
    return new ValidationError("Data validation failed.", error.errors);
  }

  if (error?.name === "MongoServerError" && error?.code === 11000) {
    return AppError.conflict(
      "A duplicate resource already exists.",
      error.keyValue,
    );
  }

  return new AppError({
    message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    code: ERROR_CODES.INTERNAL_ERROR,
    details: null,
    isOperational: false,
  });
};

export const errorHandlerMiddleware = (error, req, res, _next) => {
  const appError = toAppError(error);

  logger.error(
    {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: appError.statusCode,
      code: appError.code,
      details: appError.details,
      message: error.message,
      stack: error.stack,
      isOperational: appError.isOperational,
    },
    "Request failed",
  );

  return sendError(res, {
    statusCode: appError.statusCode,
    message: appError.message,
    code: appError.code,
    details: appError.details,
  });
};
