import { StatusCodes } from "http-status-codes";

import { SUCCESS_MESSAGES } from "../../constants/index.js";
import { sendSuccess } from "../../utils/index.js";

import { adminService } from "./admin.service.js";

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
    meta: result.meta,
  });
};

export const listUsers = async (req, res) => {
  const result = await adminService.listUsers(
    req.validated.query,
    buildRequestContext(req),
  );
  return sendPagedSuccess(res, result);
};

export const getUserById = async (req, res) => {
  const data = await adminService.getUserById(
    req.validated.params.userId,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data,
  });
};

export const updateUser = async (req, res) => {
  const data = await adminService.updateUser(
    req.validated.params.userId,
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data,
  });
};

export const verifyUserProfile = async (req, res) => {
  const data = await adminService.verifyUserProfile(
    req.validated.params.userId,
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data,
  });
};

export const listPlans = async (req, res) => {
  const data = await adminService.listPlans(
    req.validated.query,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data,
  });
};

export const createPlan = async (req, res) => {
  const data = await adminService.createPlan(
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: SUCCESS_MESSAGES.CREATED,
    data,
  });
};

export const updatePlan = async (req, res) => {
  const data = await adminService.updatePlan(
    req.validated.params.planId,
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data,
  });
};

export const listCoupons = async (req, res) => {
  const data = await adminService.listCoupons(
    req.validated.query,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data,
  });
};

export const createCoupon = async (req, res) => {
  const data = await adminService.createCoupon(
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: SUCCESS_MESSAGES.CREATED,
    data,
  });
};

export const updateCoupon = async (req, res) => {
  const data = await adminService.updateCoupon(
    req.validated.params.couponId,
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data,
  });
};

export const getSubscriptionConfig = async (req, res) => {
  const data = await adminService.getSubscriptionConfig(
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data,
  });
};

export const updateSubscriptionConfig = async (req, res) => {
  const data = await adminService.updateSubscriptionConfig(
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data,
  });
};

export const listSubscriptions = async (req, res) => {
  const result = await adminService.listSubscriptions(
    req.validated.query,
    buildRequestContext(req),
  );
  return sendPagedSuccess(res, result);
};

export const getSubscriptionById = async (req, res) => {
  const data = await adminService.getSubscriptionById(
    req.validated.params.subscriptionId,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data,
  });
};

export const cancelSubscription = async (req, res) => {
  const data = await adminService.cancelSubscription(
    req.validated.params.subscriptionId,
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data,
  });
};

export const markSubscriptionRenewalFailed = async (req, res) => {
  const data = await adminService.markSubscriptionRenewalFailed(
    req.validated.params.subscriptionId,
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data,
  });
};

export const processGracePeriodExpirations = async (req, res) => {
  const data = await adminService.processGracePeriodExpirations(
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data,
  });
};

export const manualAdjustSubscription = async (req, res) => {
  const data = await adminService.manualAdjustSubscription(
    req.validated.params.subscriptionId,
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data,
  });
};

export const listPayments = async (req, res) => {
  const result = await adminService.listPayments(
    req.validated.query,
    buildRequestContext(req),
  );
  return sendPagedSuccess(res, result);
};

export const getPaymentById = async (req, res) => {
  const data = await adminService.getPaymentById(
    req.validated.params.paymentId,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data,
  });
};

export const listPaymentLedger = async (req, res) => {
  const data = await adminService.listPaymentLedger(
    req.validated.params.paymentId,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data,
  });
};

export const processPaymentTimeouts = async (req, res) => {
  const data = await adminService.processPaymentTimeouts(
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data,
  });
};

export const manualAdjustPayment = async (req, res) => {
  const data = await adminService.manualAdjustPayment(
    req.validated.params.paymentId,
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data,
  });
};

export const listCharities = async (req, res) => {
  const result = await adminService.listCharities(
    req.validated.query,
    buildRequestContext(req),
  );
  return sendPagedSuccess(res, result);
};

export const createCharity = async (req, res) => {
  const data = await adminService.createCharity(
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: SUCCESS_MESSAGES.CREATED,
    data,
  });
};

export const updateCharity = async (req, res) => {
  const data = await adminService.updateCharity(
    req.validated.params.charityId,
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data,
  });
};

export const getContributionRule = async (req, res) => {
  const data = await adminService.getContributionRule(buildRequestContext(req));

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data,
  });
};

export const updateContributionRule = async (req, res) => {
  const data = await adminService.updateContributionRule(
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data,
  });
};

export const listDonations = async (req, res) => {
  const result = await adminService.listDonations(
    req.validated.query,
    buildRequestContext(req),
  );
  return sendPagedSuccess(res, result);
};

export const manualAdjustDonation = async (req, res) => {
  const data = await adminService.manualAdjustDonation(
    req.validated.params.donationId,
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data,
  });
};

export const listPayouts = async (req, res) => {
  const result = await adminService.listPayouts(
    req.validated.query,
    buildRequestContext(req),
  );
  return sendPagedSuccess(res, result);
};

export const createPayout = async (req, res) => {
  const data = await adminService.createPayout(
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: SUCCESS_MESSAGES.CREATED,
    data,
  });
};

export const updatePayout = async (req, res) => {
  const data = await adminService.updatePayout(
    req.validated.params.payoutId,
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data,
  });
};

export const createCharityManualAdjustment = async (req, res) => {
  const data = await adminService.createCharityManualAdjustment(
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: SUCCESS_MESSAGES.CREATED,
    data,
  });
};

export const listScores = async (req, res) => {
  const result = await adminService.listScores(
    req.validated.query,
    buildRequestContext(req),
  );
  return sendPagedSuccess(res, result);
};

export const updateScore = async (req, res) => {
  const data = await adminService.updateScore(
    req.validated.params.scoreId,
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data,
  });
};

export const listDraws = async (req, res) => {
  const result = await adminService.listDraws(
    req.validated.query,
    buildRequestContext(req),
  );
  return sendPagedSuccess(res, result);
};

export const getDrawById = async (req, res) => {
  const data = await adminService.getDrawById(
    req.validated.params.drawId,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data,
  });
};

export const createDraw = async (req, res) => {
  const data = await adminService.createDraw(
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: SUCCESS_MESSAGES.CREATED,
    data,
  });
};

export const updateDraw = async (req, res) => {
  const data = await adminService.updateDraw(
    req.validated.params.drawId,
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data,
  });
};

export const generateDrawEntries = async (req, res) => {
  const data = await adminService.generateDrawEntries(
    req.validated.params.drawId,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data,
  });
};

export const createDrawSimulation = async (req, res) => {
  const data = await adminService.createDrawSimulation(
    req.validated.params.drawId,
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: SUCCESS_MESSAGES.CREATED,
    data,
  });
};

export const listDrawSimulations = async (req, res) => {
  const data = await adminService.listDrawSimulations(
    req.validated.params.drawId,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data,
  });
};

export const publishDraw = async (req, res) => {
  const data = await adminService.publishDraw(
    req.validated.params.drawId,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data,
  });
};

export const getDrawResult = async (req, res) => {
  const data = await adminService.getDrawResult(
    req.validated.params.drawId,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data,
  });
};

export const getDrawPrizePool = async (req, res) => {
  const data = await adminService.getDrawPrizePool(
    req.validated.params.drawId,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data,
  });
};

export const addJackpotFund = async (req, res) => {
  const data = await adminService.addJackpotFund(
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: SUCCESS_MESSAGES.CREATED,
    data,
  });
};

export const listJackpotLedger = async (req, res) => {
  const data = await adminService.listJackpotLedger(buildRequestContext(req));

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data,
  });
};

export const listWinners = async (req, res) => {
  const result = await adminService.listWinners(
    req.validated.query,
    buildRequestContext(req),
  );
  return sendPagedSuccess(res, result);
};

export const getWinnerById = async (req, res) => {
  const data = await adminService.getWinnerById(
    req.validated.params.winnerId,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data,
  });
};

export const listWinnerProofs = async (req, res) => {
  const data = await adminService.listWinnerProofs(
    req.validated.params.winnerId,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data,
  });
};

export const reviewWinnerProof = async (req, res) => {
  const data = await adminService.reviewWinnerProof(
    req.validated.params.winnerId,
    req.validated.params.proofId,
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data,
  });
};

export const updateWinnerPayout = async (req, res) => {
  const data = await adminService.updateWinnerPayout(
    req.validated.params.winnerId,
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data,
  });
};

export const listAuditEvents = async (req, res) => {
  const result = await adminService.listAuditEvents(
    req.validated.query,
    buildRequestContext(req),
  );
  return sendPagedSuccess(res, result);
};
