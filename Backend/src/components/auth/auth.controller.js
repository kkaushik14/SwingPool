import { StatusCodes } from "http-status-codes";

import { SUCCESS_MESSAGES } from "../../constants/index.js";
import { sendSuccess } from "../../utils/index.js";
import { usersService } from "../users/users.service.js";

import { authService } from "./auth.service.js";

const buildRequestContext = (req) => ({
  requestId: req.requestId,
  userAgent: req.get("user-agent") || "",
  ipAddress: req.ip,
  role: req.auth?.role,
  actorId: req.auth?.sub,
});

export const register = async (req, res) => {
  const { body } = req.validated;
  const result = await authService.registerUser(body, buildRequestContext(req));

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: SUCCESS_MESSAGES.CREATED,
    data: result,
  });
};

export const login = async (req, res) => {
  const { body } = req.validated;
  const result = await authService.loginUser(body, buildRequestContext(req));

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: result,
  });
};

export const refresh = async (req, res) => {
  const { refreshToken } = req.validated.body;
  const result = await authService.refreshTokens(
    refreshToken,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: result,
  });
};

export const logout = async (req, res) => {
  const { refreshToken } = req.validated.body;
  const result = await authService.logoutUser(
    req.auth.sub,
    refreshToken,
    req.auth,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: result,
  });
};

export const me = async (req, res) => {
  const user = await usersService.getUserProfile(req.auth.sub);

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: user,
  });
};

export const verifyEmail = async (req, res) => {
  const result = await authService.verifyEmailToken(
    req.validated.body.token,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data: result,
  });
};

export const resendEmailVerification = async (req, res) => {
  const result = await authService.resendEmailVerification(
    req.validated.body.email,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: result,
  });
};

export const forgotPassword = async (req, res) => {
  const result = await authService.forgotPassword(
    req.validated.body.email,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: result,
  });
};

export const resetPassword = async (req, res) => {
  const result = await authService.resetPassword(
    req.validated.body.token,
    req.validated.body.newPassword,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data: result,
  });
};
