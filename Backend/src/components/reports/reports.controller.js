import { StatusCodes } from "http-status-codes";

import { SUCCESS_MESSAGES } from "../../constants/index.js";
import { sendSuccess } from "../../utils/index.js";

import { reportsService } from "./reports.service.js";

const buildRequestContext = (req) => ({
  actorId: req.auth?.sub,
  role: req.auth?.role,
  requestId: req.requestId,
});

const sendPagedSuccess = (res, result) => {
  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: result.items,
    meta: {
      ...(result.meta || {}),
      summary: result.summary || null,
    },
  });
};

export const getOverviewReport = async (req, res) => {
  const data = await reportsService.getOverview(
    req.validated.query,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data,
  });
};

export const getUsersReport = async (req, res) => {
  const result = await reportsService.getUsersReport(
    req.validated.query,
    buildRequestContext(req),
  );
  return sendPagedSuccess(res, result);
};

export const getSubscriptionsReport = async (req, res) => {
  const result = await reportsService.getSubscriptionsReport(
    req.validated.query,
    buildRequestContext(req),
  );
  return sendPagedSuccess(res, result);
};

export const getPaymentsReport = async (req, res) => {
  const result = await reportsService.getPaymentsReport(
    req.validated.query,
    buildRequestContext(req),
  );
  return sendPagedSuccess(res, result);
};

export const getCharitiesReport = async (req, res) => {
  const data = await reportsService.getCharitiesReport(
    req.validated.query,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data,
  });
};

export const getDrawsReport = async (req, res) => {
  const result = await reportsService.getDrawsReport(
    req.validated.query,
    buildRequestContext(req),
  );
  return sendPagedSuccess(res, result);
};

export const getWinnersReport = async (req, res) => {
  const result = await reportsService.getWinnersReport(
    req.validated.query,
    buildRequestContext(req),
  );
  return sendPagedSuccess(res, result);
};
