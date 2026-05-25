import jwt from "jsonwebtoken";

import { config } from "../config/index.js";

export const signAccessToken = (payload, options = {}) => {
  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.accessTokenExpiresIn,
    ...options,
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, config.auth.jwtSecret);
};

export const signRefreshToken = (payload, options = {}) => {
  return jwt.sign(payload, config.auth.refreshTokenSecret, {
    expiresIn: config.auth.refreshTokenExpiresIn,
    ...options,
  });
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.auth.refreshTokenSecret);
};
