import { StatusCodes } from "http-status-codes";

import { SUCCESS_MESSAGES } from "../../constants/index.js";
import { sendSuccess } from "../../utils/index.js";

import { scoresService } from "./scores.service.js";

const requestContextFromReq = (req) => ({
  requestId: req.requestId,
  actorId: req.auth?.sub,
  role: req.auth?.role,
});

export const listMineHistory = async (req, res) => {
  const result = await scoresService.listHistoryForUser(
    req.auth.sub,
    req.validated.query,
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: result.items,
    meta: result.meta,
  });
};

export const getMineById = async (req, res) => {
  const record = await scoresService.getForUser(
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
  const created = await scoresService.createForUser(
    req.auth.sub,
    req.validated.body,
    requestContextFromReq(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: SUCCESS_MESSAGES.CREATED,
    data: created,
  });
};

export const listMineCompetitionQualifying = async (req, res) => {
  const result = await scoresService.getCompetitionQualifyingScoresForUser(
    req.auth.sub,
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: result,
  });
};

export const getMineCompetitionEligibility = async (req, res) => {
  const result = await scoresService.getCompetitionEligibilityForUser(
    req.auth.sub,
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: result,
  });
};

export const updateByAdmin = async (req, res) => {
  const updated = await scoresService.adminUpdateScore(
    req.validated.params.id,
    req.validated.body,
    requestContextFromReq(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data: updated,
  });
};
