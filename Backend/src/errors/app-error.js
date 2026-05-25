import { StatusCodes } from "http-status-codes";

import { ERROR_CODES } from "./error-codes.js";

export class AppError extends Error {
  constructor({
    message,
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR,
    code = ERROR_CODES.INTERNAL_ERROR,
    details = null,
    isOperational = true,
  }) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      details: this.details,
      isOperational: this.isOperational,
    };
  }

  static badRequest(message, details = null) {
    return new AppError({
      message,
      statusCode: StatusCodes.BAD_REQUEST,
      code: ERROR_CODES.BAD_REQUEST,
      details,
    });
  }

  static validation(message, details = null) {
    return new AppError({
      message,
      statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR,
      details,
    });
  }

  static unauthorized(message = "Authentication is required.") {
    return new AppError({
      message,
      statusCode: StatusCodes.UNAUTHORIZED,
      code: ERROR_CODES.UNAUTHORIZED,
    });
  }

  static forbidden(message = "You do not have permission for this action.") {
    return new AppError({
      message,
      statusCode: StatusCodes.FORBIDDEN,
      code: ERROR_CODES.FORBIDDEN,
    });
  }

  static notFound(message = "Resource not found.") {
    return new AppError({
      message,
      statusCode: StatusCodes.NOT_FOUND,
      code: ERROR_CODES.NOT_FOUND,
    });
  }

  static conflict(message, details = null) {
    return new AppError({
      message,
      statusCode: StatusCodes.CONFLICT,
      code: ERROR_CODES.CONFLICT,
      details,
    });
  }
}
