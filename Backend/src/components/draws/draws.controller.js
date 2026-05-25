import { StatusCodes } from "http-status-codes";

import { SUCCESS_MESSAGES } from "../../constants/index.js";
import { sendSuccess } from "../../utils/index.js";

import { drawsService } from "./draws.service.js";

const requestContextFromReq = (req) => ({
  requestId: req.requestId,
  actorId: req.auth?.sub,
  role: req.auth?.role,
});

export const getDrawConfig = async (_req, res) => {
  const config = await drawsService.getConfig();

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: config,
  });
};

export const updateDrawConfig = async (req, res) => {
  const updated = await drawsService.updateConfig(
    req.validated.body,
    requestContextFromReq(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data: updated,
  });
};

export const listDrawSnapshots = async (_req, res) => {
  const records = await drawsService.listAll();

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: records,
  });
};

export const getDrawSnapshotById = async (req, res) => {
  const record = await drawsService.getById(req.validated.params.id);

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: record,
  });
};

export const createDrawSnapshot = async (req, res) => {
  const created = await drawsService.createSnapshot(
    req.validated.body,
    requestContextFromReq(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: SUCCESS_MESSAGES.CREATED,
    data: created,
  });
};

export const updateDrawSnapshot = async (req, res) => {
  const updated = await drawsService.updateSnapshot(
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

export const generateDrawEntries = async (req, res) => {
  const generated = await drawsService.generateEntries(
    req.validated.params.id,
    requestContextFromReq(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: generated,
  });
};

export const listDrawEntries = async (req, res) => {
  const entries = await drawsService.listEntries(req.validated.params.id);

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: entries,
  });
};

export const createDrawSimulation = async (req, res) => {
  const simulation = await drawsService.runSimulation(
    req.validated.params.id,
    req.validated.body,
    requestContextFromReq(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: SUCCESS_MESSAGES.CREATED,
    data: simulation,
  });
};

export const listDrawSimulations = async (req, res) => {
  const simulations = await drawsService.listSimulations(
    req.validated.params.id,
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: simulations,
  });
};

export const publishDraw = async (req, res) => {
  const published = await drawsService.publishDraw(
    req.validated.params.id,
    requestContextFromReq(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data: published,
  });
};

export const getPublishedDrawResult = async (req, res) => {
  const result = await drawsService.getPublishedResult(req.validated.params.id);

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: result,
  });
};

export const getDrawPrizePool = async (req, res) => {
  const prizePool = await drawsService.getPrizePool(req.validated.params.id);

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: prizePool,
  });
};

export const addManualJackpotFund = async (req, res) => {
  const created = await drawsService.addManualJackpotFund(
    req.validated.body,
    requestContextFromReq(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: SUCCESS_MESSAGES.CREATED,
    data: created,
  });
};

export const listJackpotLedger = async (_req, res) => {
  const records = await drawsService.listJackpotLedger();

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: records,
  });
};
