import { ValidationError } from "../errors/index.js";

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const validationResult = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!validationResult.success) {
      return next(
        new ValidationError(
          "Request validation failed.",
          validationResult.error.flatten(),
        ),
      );
    }

    req.validated = validationResult.data;
    return next();
  };
};
