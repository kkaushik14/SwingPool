import { StatusCodes } from "http-status-codes";

import { SUCCESS_MESSAGES } from "../../constants/index.js";
import { sendSuccess } from "../../utils/index.js";

import { usersService } from "./users.service.js";

const requestContextFromRequest = (req) => ({
  requestId: req.requestId,
  actorId: req.auth?.sub,
  actorRole: req.auth?.role,
});

export const listUsers = async (_req, res) => {
  const users = await usersService.listUsers();

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: users,
  });
};

export const getUserById = async (req, res) => {
  const user = await usersService.getUserById(req.validated.params.id);

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: user,
  });
};

export const getMyProfile = async (req, res) => {
  const user = await usersService.getUserProfile(req.auth.sub);

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: user,
  });
};

export const getMyProfileVerificationStatus = async (req, res) => {
  const status = await usersService.getProfileVerificationStatus(req.auth.sub);

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: status,
  });
};

export const updateMyProfile = async (req, res) => {
  const updatedUser = await usersService.updateOwnProfile(
    req.auth.sub,
    req.validated.body,
    requestContextFromRequest(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data: updatedUser,
  });
};

export const adminUpdateUser = async (req, res) => {
  const updatedUser = await usersService.adminUpdateUser(
    req.validated.params.id,
    req.validated.body,
    requestContextFromRequest(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data: updatedUser,
  });
};

export const adminVerifyUserProfile = async (req, res) => {
  const updatedUser = await usersService.adminVerifyUserProfile(
    req.validated.params.id,
    req.validated.body,
    requestContextFromRequest(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data: updatedUser,
  });
};
