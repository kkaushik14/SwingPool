export const SUCCESS_MESSAGES = Object.freeze({
  DEFAULT: "Request completed successfully.",
  CREATED: "Resource created successfully.",
  UPDATED: "Resource updated successfully.",
  DELETED: "Resource deleted successfully.",
  HEALTHY: "Service is healthy.",
});

export const ERROR_MESSAGES = Object.freeze({
  INTERNAL_SERVER_ERROR: "An unexpected error occurred.",
  VALIDATION_ERROR: "Request validation failed.",
  NOT_FOUND: "Resource not found.",
  UNAUTHORIZED: "Authentication is required.",
  FORBIDDEN: "You do not have permission for this action.",
});
