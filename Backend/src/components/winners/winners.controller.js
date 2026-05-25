import { StatusCodes } from "http-status-codes";

import { SUCCESS_MESSAGES } from "../../constants/index.js";
import { sendSuccess } from "../../utils/index.js";

import { winnersService } from "./winners.service.js";

const requestContextFromReq = (req) => ({
  requestId: req.requestId,
  actorId: req.auth?.sub,
  role: req.auth?.role,
});

export const listMineWinners = async (req, res) => {
  const records = await winnersService.listMine(req.auth.sub);

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: records,
  });
};

export const getMineWinnerById = async (req, res) => {
  const record = await winnersService.getMineById(
    req.auth.sub,
    req.validated.params.id,
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: record,
  });
};

export const listWinnersAdmin = async (req, res) => {
  const records = await winnersService.adminListAll(req.validated.query);

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: records,
  });
};

export const getWinnerById = async (req, res) => {
  const record = await winnersService.getById(req.validated.params.id);

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: record,
  });
};

export const createWinner = async (req, res) => {
  const created = await winnersService.create(
    req.validated.body,
    requestContextFromReq(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: SUCCESS_MESSAGES.CREATED,
    data: created,
  });
};

export const submitWinnerProof = async (req, res) => {
  const created = await winnersService.submitProof({
    winnerId: req.validated.params.winnerId,
    requesterUserId: req.auth.sub,
    requesterRole: req.auth.role,
    payload: req.validated.body,
    requestContext: requestContextFromReq(req),
  });

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: SUCCESS_MESSAGES.CREATED,
    data: created,
  });
};

export const listWinnerProofs = async (req, res) => {
  const records = await winnersService.listProofSubmissions({
    winnerId: req.validated.params.winnerId,
    requesterUserId: req.auth.sub,
    requesterRole: req.auth.role,
  });

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: records,
  });
};

export const reviewWinnerProof = async (req, res) => {
  const updated = await winnersService.reviewProofSubmission({
    winnerId: req.validated.params.winnerId,
    proofId: req.validated.params.proofId,
    payload: req.validated.body,
    requestContext: requestContextFromReq(req),
  });

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data: updated,
  });
};

export const updateWinnerPayout = async (req, res) => {
  const updated = await winnersService.updatePayoutStatus({
    winnerId: req.validated.params.winnerId,
    payload: req.validated.body,
    requestContext: requestContextFromReq(req),
  });

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data: updated,
  });
};
