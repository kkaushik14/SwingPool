import { StatusCodes } from "http-status-codes";

import { ERROR_CODES } from "./error-codes.js";
import { AppError } from "./app-error.js";

export class AuthError extends AppError {
  constructor(
    message = "Authentication failed.",
    details = null,
    statusCode = StatusCodes.UNAUTHORIZED,
  ) {
    super({
      message,
      statusCode,
      code:
        statusCode === StatusCodes.FORBIDDEN
          ? ERROR_CODES.FORBIDDEN
          : ERROR_CODES.UNAUTHORIZED,
      details,
    });
  }

  static forbidden(
    message = "You do not have permission for this action.",
    details = null,
  ) {
    return new AuthError(message, details, StatusCodes.FORBIDDEN);
  }
}
