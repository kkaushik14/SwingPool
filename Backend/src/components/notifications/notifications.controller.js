import { StatusCodes } from "http-status-codes";

import { SUCCESS_MESSAGES } from "../../constants/index.js";
import { sendSuccess } from "../../utils/index.js";

import { notificationsService } from "./notifications.service.js";

export const listMine = async (req, res) => {
  const records = await notificationsService.listForUser(req.auth.sub);

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: records,
  });
};

export const getMineById = async (req, res) => {
  const record = await notificationsService.getForUser(
    req.auth.sub,
    req.validated.params.id,
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: record,
  });
};

export const createMine = async (req, res) => {
  const created = await notificationsService.createForUser(
    req.auth.sub,
    req.validated.body,
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: SUCCESS_MESSAGES.CREATED,
    data: created,
  });
};

export const updateMine = async (req, res) => {
  const updated = await notificationsService.updateForUser(
    req.auth.sub,
    req.validated.params.id,
    req.validated.body,
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data: updated,
  });
};
