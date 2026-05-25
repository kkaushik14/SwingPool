import { AUTH_TOKEN_TYPES } from "../components/auth/auth.enums.js";
import { authRepository } from "../components/auth/auth.repository.js";
import { usersRepository } from "../components/users/users.repository.js";
import { USER_STATUSES } from "../enums/index.js";
import { AuthError } from "../errors/index.js";
import { verifyAccessToken } from "../services/index.js";

const extractBearerToken = (authorizationHeader = "") => {
  if (!authorizationHeader.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice("Bearer ".length).trim();
};

export const authenticate = async (req, _res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      throw new AuthError("A valid Bearer token is required.");
    }

    let payload;

    try {
      payload = verifyAccessToken(token);
    } catch (_error) {
      throw new AuthError("Access token is invalid or expired.");
    }

    if (payload?.tokenType !== AUTH_TOKEN_TYPES.ACCESS) {
      throw new AuthError("Access token payload is invalid.");
    }

    if (!payload?.sub || !payload?.jti) {
      throw new AuthError("Access token payload is incomplete.");
    }

    const isRevoked = await authRepository.isTokenRevoked(payload.jti);

    if (isRevoked) {
      throw new AuthError("Access token has been revoked.");
    }

    const user = await usersRepository.findById(payload.sub);

    if (!user) {
      throw new AuthError("Authenticated user no longer exists.");
    }

    if (user.status === USER_STATUSES.SUSPENDED) {
      throw AuthError.forbidden("Your account is suspended.");
    }

    if (user.status === USER_STATUSES.INACTIVE) {
      throw AuthError.forbidden("Your account is inactive.");
    }

    req.auth = payload;
    req.user = user;

    return next();
  } catch (error) {
    return next(error);
  }
};
