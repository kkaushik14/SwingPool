import { StatusCodes } from "http-status-codes";

import { ERROR_CODES } from "./error-codes.js";
import { AppError } from "./app-error.js";

export class DomainError extends AppError {
  constructor(
    message = "Domain rule violation.",
    details = null,
    statusCode = StatusCodes.UNPROCESSABLE_ENTITY,
  ) {
    super({
      message,
      statusCode,
      code: ERROR_CODES.DOMAIN_ERROR,
      details,
    });
  }
}
