import { StatusCodes } from "http-status-codes";

import { ERROR_CODES } from "./error-codes.js";
import { AppError } from "./app-error.js";

export class PaymentError extends AppError {
  constructor(
    message = "Payment operation failed.",
    details = null,
    statusCode = StatusCodes.BAD_REQUEST,
  ) {
    super({
      message,
      statusCode,
      code: ERROR_CODES.PAYMENT_ERROR,
      details,
    });
  }
}
