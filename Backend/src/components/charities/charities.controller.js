import { StatusCodes } from "http-status-codes";

import { SUCCESS_MESSAGES } from "../../constants/index.js";
import { sendSuccess } from "../../utils/index.js";

import { charitiesService } from "./charities.service.js";

const requestContextFromReq = (req) => ({
  requestId: req.requestId,
  actorId: req.auth?.sub,
  role: req.auth?.role,
});

export const listCharity = async (_req, res) => {
  const records = await charitiesService.listAll();

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: records,
  });
};

export const getCharityById = async (req, res) => {
  const record = await charitiesService.getById(req.validated.params.id);

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: record,
  });
};

export const createCharity = async (req, res) => {
  const created = await charitiesService.create(
    req.validated.body,
    requestContextFromReq(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: SUCCESS_MESSAGES.CREATED,
    data: created,
  });
};

export const updateCharity = async (req, res) => {
  const updated = await charitiesService.update(
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

export const getContributionRule = async (_req, res) => {
  const rule = await charitiesService.getContributionRule();

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: rule,
  });
};

export const updateContributionRule = async (req, res) => {
  const updated = await charitiesService.adminUpdateContributionRule(
    req.validated.body,
    requestContextFromReq(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data: updated,
  });
};

export const getMySelection = async (req, res) => {
  const selection = await charitiesService.getMyActiveSelection(req.auth.sub);

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: selection,
  });
};

export const listMySelectionHistory = async (req, res) => {
  const selections = await charitiesService.listMySelectionHistory(
    req.auth.sub,
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: selections,
  });
};

export const setMySelection = async (req, res) => {
  const updated = await charitiesService.setMySelection(
    req.auth.sub,
    req.validated.body,
    requestContextFromReq(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data: updated,
  });
};

export const createDonationIntent = async (req, res) => {
  const created = await charitiesService.createDonationIntent(
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

export const listMyDonations = async (req, res) => {
  const donations = await charitiesService.listMyDonations(req.auth.sub);

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: donations,
  });
};

export const listPayoutEntries = async (_req, res) => {
  const payouts = await charitiesService.listPayoutEntries();

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: payouts,
  });
};

export const createPayoutEntry = async (req, res) => {
  const created = await charitiesService.createPayoutEntry(
    req.validated.body,
    requestContextFromReq(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: SUCCESS_MESSAGES.CREATED,
    data: created,
  });
};

export const updatePayoutEntry = async (req, res) => {
  const updated = await charitiesService.updatePayoutEntry(
    req.validated.params.payoutId,
    req.validated.body,
    requestContextFromReq(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data: updated,
  });
};

export const createManualAdjustment = async (req, res) => {
  const created = await charitiesService.createManualAdjustment(
    req.validated.body,
    requestContextFromReq(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: SUCCESS_MESSAGES.CREATED,
    data: created,
  });
};

export const getCharityReportsSummary = async (req, res) => {
  const summary = await charitiesService.getReportsSummary(req.validated.query);

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: summary,
  });
};
