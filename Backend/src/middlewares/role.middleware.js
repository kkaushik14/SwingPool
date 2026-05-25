import { AuthError } from "../errors/index.js";

export const authorizeRoles = (...roles) => {
  return (req, _res, next) => {
    const userRole = req.auth?.role;

    if (!userRole || !roles.includes(userRole)) {
      return next(
        AuthError.forbidden("You are not authorized for this action."),
      );
    }

    return next();
  };
};
