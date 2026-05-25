import { StatusCodes } from "http-status-codes";

import { ERROR_CODES } from "./error-codes.js";
import { AppError } from "./app-error.js";

export class ConflictError extends AppError {
  constructor(message = "Conflict detected.", details = null) {
    super({
      message,
      statusCode: StatusCodes.CONFLICT,
      code: ERROR_CODES.CONFLICT,
      details,
    });
  }
}
