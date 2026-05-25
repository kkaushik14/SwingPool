import { StatusCodes } from "http-status-codes";

import { ERROR_CODES } from "./error-codes.js";
import { AppError } from "./app-error.js";

export class ValidationError extends AppError {
  constructor(message = "Request validation failed.", details = null) {
    super({
      message,
      statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR,
      details,
    });
  }
}
