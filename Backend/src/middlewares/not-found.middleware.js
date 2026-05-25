import { AppError } from "../errors/index.js";

export const notFoundMiddleware = (req, _res, next) => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};
